import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login attempts per IP per 15 min
  message: {
    success: false,
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts from this IP address, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

export const publicRollLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // max 60 requests per 5 minutes
  message: {
    success: false,
    errorCode: 'PUBLIC_ROLL_RATE_LIMIT_EXCEEDED',
    message: 'Too many scan requests from this IP address, please try again in a few minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});


