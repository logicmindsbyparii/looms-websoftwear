import { Server } from 'socket.io';
import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../models/User.js';
import { Machine } from '../models/Machine.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;
let telemetryTimer = null;

export const initSocket = (server, clientUrl) => {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin, localhost, 127.0.0.1, or local LAN
        callback(null, true);
      },
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket Authentication Middleware
  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded || !decoded.sub) {
        return next(new Error('Invalid or expired WebSocket token'));
      }

      const user = await User.findById(decoded.sub).select('_id username role isActive');
      if (!user || !user.isActive) {
        return next(new Error('User account inactive or not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('WebSocket authentication failed'));
    }
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`WebSocket Client connected: ${socket.user.username} (${socket.user.role}) - ID: ${socket.id}`);

    // Join role room and user-specific room
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on('disconnect', () => {
      logger.info(`WebSocket Client disconnected: ${socket.user.username}`);
    });
  });

  // Start background telemetry simulation for running looms (simulates real factory sensors)
  startTelemetrySimulation();

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

export const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (ioInstance) {
    ioInstance.to(`role:${role}`).emit(event, data);
  }
};

export const emitToUser = (userId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  }
};

function startTelemetrySimulation() {
  if (telemetryTimer) clearInterval(telemetryTimer);

  telemetryTimer = setInterval(async () => {
    try {
      if (!ioInstance) return;

      const runningMachines = await Machine.find({ status: 'running' });
      if (runningMachines.length === 0) return;

      const updates = [];
      for (const m of runningMachines) {
        const deltaRpm = Math.floor(Math.random() * 14 - 7);
        const newRpm = Math.max(500, Math.min(1100, m.rpm + deltaRpm));
        const deltaTemp = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newTemp = Math.max(30, Math.min(60, m.temp + deltaTemp));
        const pickIncrement = Math.random() > 0.6 ? 1 : 0;

        m.rpm = newRpm;
        m.temp = newTemp;
        m.output += pickIncrement;
        m.picksPerMin = Math.floor(newRpm * 0.94);
        m.efficiency = Math.min(100, Math.round((m.output / (m.targetOutput || 75)) * 100));

        await m.save();
        updates.push({
          id: m.id,
          rpm: m.rpm,
          temp: m.temp,
          output: m.output,
          picksPerMin: m.picksPerMin,
          efficiency: m.efficiency
        });
      }

      if (updates.length > 0) {
        ioInstance.emit('telemetry:batch', updates);
      }
    } catch (err) {
      // Ignore background telemetry errors
    }
  }, 4000);
}

