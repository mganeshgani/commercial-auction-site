require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS Configuration - Allow production frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://sports-auction.vercel.app',
  'https://sports-auction-oc52.vercel.app', // Production URL
  'https://sports-auction-*.vercel.app' // Allow Vercel preview deployments
];

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
    const roomName = `auctioneer_${auctioneerId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
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

app.use(express.json());

// Cookie parser middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// MongoDB Connection
const path = require('path');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

// Make io accessible to routes
app.set('io', io);

// Import Routes
const playerRoutes = require('./routes/player.routes');
const teamRoutes = require('./routes/team.routes');
const authRoutes = require('./routes/auth.routes');
const formConfigRoutes = require('./routes/formConfig.routes');
const adminRoutes = require('./routes/admin.routes');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Sports Auction API is running' });
});

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/form-config', formConfigRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.io is ready');
});