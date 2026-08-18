require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
// Native Node.js tools used to build the physical server that socket.io needs to attach to.
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const reportRoutes = require('./routes/report');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
//
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
// Blocks hackers. It says "Only let http://localhost:5173 (your React frontend) send requests to this API. Block everything else."
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
//When your frontend sends data (like a username and password) as JSON, this parses it so 
// JavaScript can read it. It also increases the file size limit to 10mb just in case the AI 
// sends back massive amounts of data.
app.use(express.json({ limit: '10mb' }));
//Allows the server to read data sent from standard HTML forms.
app.use(express.urlencoded({ extended: true }));

// Health check
//A simple route. If you visit /health, it confirms the server is alive. This is useful for deployment platforms (like Render or Heroku) to check if your server crashed.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview API is running 🚀', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/report', reportRoutes);

// Socket.io events (for real-time typing indicator, etc.)
io.on('connection', (socket) => {
  //This is the global listener. It sits and waits for a user to open your website.
  //When a user opens the site, the frontend sends a handshake. A direct pipeline is opened, and that specific user is handed a unique identifier (socket.id, e.g., aB3dEf9g...).
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-interview', (interviewId) => {
    //he backend is listening for a custom message called "join-interview".
    //When the frontend starts an interview, it emits this message and passes the interviewId to the backend.
    //Socket.io has a brilliant feature called "Rooms". This command takes the user and places them 
    // into a virtual room named after the interviewId. If an administrator, a recruiter, or a bot
    //  wanted to watch the interview live, they could join this exact same room.
    socket.join(interviewId);
    console.log(`User joined interview room: ${interviewId}`);
  });
//he backend listens for a "typing" message. Every time the user presses a key on their keyboard on the frontend, the frontend shoots a quick message saying
  socket.on('typing', ({ interviewId, isTyping }) => {
    //his tells the server to look at the specific virtual room for this interview.
    socket.to(interviewId).emit('user-typing', isTyping);
  });
//If the user closes their browser tab, loses their Wi-Fi connection, or navigates away from the website, the live pipeline is severed.
//Socket.io detects this instantly and runs this block, allowing you to log it or clean up data (like marking the user as "offline" in a database).
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
// If any code anywhere in your app crashes (e.g., the AI API fails, or a database query breaks), the error is forwarded here. This middleware
//  catches it and sends a clean JSON error back to the frontend instead of completely shutting down
//  the Node server.
app.use(errorHandler);

// 404 handler
// The * means "Catch Everything Else". If a user tries to visit a route that doesn't exist 
// (like /api/magical-unicorns), it hits this and returns a clean 404 Error.
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🗄️  MongoDB URI: ${process.env.MONGODB_URI}`);
  console.log(`🤖 GROQ AI: Ready\n`);
});

module.exports = { app, io };
