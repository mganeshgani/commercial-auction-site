import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

/**
 * Initialize socket connection and join auctioneer-specific room
 * This ensures real-time updates are isolated per auctioneer
 */
export const initializeSocket = () => {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✓ Socket.io connected:', socket.id);
    
    // Join auctioneer-specific room
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user._id || user.userId) {
          const auctioneerId = user._id || user.userId;
          socket.emit('joinAuctioneer', auctioneerId);
          console.log(`✓ Joined auctioneer room: ${auctioneerId}`);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  });

  socket.on('disconnect', (reason: string) => {
    console.log('Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
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
