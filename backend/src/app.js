import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

const app = express();

// Disable ETags to prevent 304 Not Modified for real-time factory operations data
app.set('etag', false);

// Ensure no-cache headers for all real-time API requests so clients always receive fresh 200 OK data
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration - Support localhost, LAN IP (192.168.x.x for phone scanning), and public clients
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.PUBLIC_APP_URL || '',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const isDev = (process.env.NODE_ENV || 'development') === 'development';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, direct mobile browsers, etc.)
      if (!origin) return callback(null, true);

      // Allow any local LAN IP (192.168.x.x, 10.x.x.x, localhost) so phone QR scanning always works on Wi-Fi
      const isLocalOrLan = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isLocalOrLan || isDev) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept-Language', 'Cache-Control', 'Pragma']
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hpp());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    db: isDbConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    system: 'LOOMUS 2.0 Backend'
  });
});

// API Routes
app.use('/api', routes);

// Centralized error handler
app.use(errorHandler);

export default app;
