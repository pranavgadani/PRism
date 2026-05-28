require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const githubRoutes = require('./routes/githubRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reviewSocket = require('./socket/reviewSocket');

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Accept localhost (Vite) and the deployed CLIENT_URL
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      origin === process.env.CLIENT_URL
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Socket.IO setup
const io = new Server(httpServer, { cors: corsOptions });

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/github', githubRoutes);
app.use('/review', reviewRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.IO review handler
reviewSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PRism server running on port ${PORT}`);
});
