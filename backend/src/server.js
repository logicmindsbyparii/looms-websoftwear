import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server, process.env.CLIENT_URL);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`===================================================`);
      logger.info(`🚀 LOOMUS 2.0 Backend Server running on port ${PORT}`);
      logger.info(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 API Base: http://localhost:${PORT}/api`);
      logger.info(`⚡ WebSocket endpoint ready`);
      logger.info(`===================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

