import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

const app = express();

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept-Language']
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
  res.status(200).json({ status: 'ok', time: new Date().toISOString(), system: 'LOOMUS 2.0 Backend' });
});

// API Routes
app.use('/api', routes);

// Centralized error handler
app.use(errorHandler);

export default app;

