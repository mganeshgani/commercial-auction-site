require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');

const app = express();
const server = http.createServer(app);

// CORS Configuration - Allow production frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL, // Production frontend URL from environment
  'https://neoauction.vercel.app',
  'https://sports-auction.vercel.app',
  'https://sports-auction-oc52.vercel.app',
  'https://sports-auction-*.vercel.app',
  'https://neoauction-*.vercel.app' // Allow Vercel preview deployments
].filter(Boolean); // Remove undefined values

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
          return pattern.test(origin);
        }
        return allowedOrigin === origin;
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Socket.io connection handling with auctioneer rooms
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join auctioneer-specific room when authenticated
  socket.on('joinAuctioneer', (auctioneerId) => {
    console.log(`📥 Received joinAuctioneer request from socket ${socket.id} with auctioneerId:`, auctioneerId);
    const roomName = `auctioneer_${auctioneerId}`;
    socket.join(roomName);
    console.log(`✅ Socket ${socket.id} successfully joined room: ${roomName}`);
    
    // Verify the join worked
    const room = io.sockets.adapter.rooms.get(roomName);
    console.log(`📊 Room ${roomName} now has ${room ? room.size : 0} client(s)`);
  });

  // Leave auctioneer room
  socket.on('leaveAuctioneer', (auctioneerId) => {
    const roomName = `auctioneer_${auctioneerId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Bid events are now scoped to auctioneer rooms (sent from client with auctioneerId)
  socket.on('placeBid', (data) => {
    console.log('Bid placed:', data);
    if (data.auctioneerId) {
      io.to(`auctioneer_${data.auctioneerId}`).emit('bidPlaced', data);
    }
  });

  // Auction start events are scoped to auctioneer rooms
  socket.on('startAuction', (data) => {
    console.log('Auction started:', data);
    if (data.auctioneerId) {
      io.to(`auctioneer_${data.auctioneerId}`).emit('auctionStarted', data);
    }
  });
});

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = new RegExp(allowedOrigin.replace('\\*', '.*'));
        return pattern.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

// Gzip compression for responses (faster loading)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// MongoDB Connection with optimized settings
const path = require('path');
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Make io accessible to routes
app.set('io', io);

// Import Routes
const playerRoutes = require('./routes/player.routes');
const teamRoutes = require('./routes/team.routes');
const authRoutes = require('./routes/auth.routes');
const formConfigRoutes = require('./routes/formConfig.routes');
const adminRoutes = require('./routes/admin.routes');
const appConfigRoutes = require('./routes/appConfig.routes');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Sports Auction API is running' });
});

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/form-config', formConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', appConfigRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.io is ready');
});