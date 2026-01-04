import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// Singleton socket instance
let socketInstance: any = null;

/**
 * Initialize socket connection and join auctioneer-specific room
 * This ensures real-time updates are isolated per auctioneer
 * Returns the same socket instance for all calls (singleton pattern)
 */
export const initializeSocket = () => {
  // Return existing instance if already created
  if (socketInstance && socketInstance.connected) {
    console.log('♻️ Reusing existing socket instance:', socketInstance.id);
    return socketInstance;
  }

  console.log('🆕 Creating new socket instance...');
  socketInstance = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: false // Don't auto-connect, we'll connect manually after auth check
  });

  socketInstance.on('connect', () => {
    console.log('✓ Socket.io connected:', socketInstance.id);
    
    // Join auctioneer-specific room
    const userStr = localStorage.getItem('user');
    console.log('👤 User data from localStorage:', userStr ? 'exists' : 'missing');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('👤 Parsed user:', user);
        
        if (user._id || user.userId) {
          const auctioneerId = user._id || user.userId;
          console.log(`📤 Emitting joinAuctioneer with ID: ${auctioneerId}`);
          socketInstance.emit('joinAuctioneer', auctioneerId);
          console.log(`✓ Joined auctioneer room: auctioneer_${auctioneerId}`);
        } else {
          console.error('❌ No user ID found in user object:', user);
        }
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    } else {
      console.warn('⚠️ No user data in localStorage - socket connected but not joined to room');
    }
  });

  socketInstance.on('disconnect', (reason: string) => {
    console.log('Socket.io disconnected:', reason);
  });

  socketInstance.on('connect_error', (error: Error) => {
    console.error('Socket connection error:', error);
  });

  // Only connect if user is authenticated
  const userStr = localStorage.getItem('user');
  if (userStr) {
    socketInstance.connect();
  } else {
    console.log('⏸️ Socket created but not connected (waiting for authentication)');
  }

  return socketInstance;
};

/**
 * Connect socket manually after authentication
 */
export const connectSocket = () => {
  if (socketInstance && !socketInstance.connected) {
    console.log('🔗 Manually connecting socket after authentication...');
    socketInstance.connect();
  }
};

/**
 * Get auctioneer ID from localStorage
 */
export const getAuctioneerId = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user._id || user.userId || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};
