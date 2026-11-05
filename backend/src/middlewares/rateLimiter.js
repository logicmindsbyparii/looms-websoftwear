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

export const publicDeliveryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  message: {
    success: false,
    errorCode: 'PUBLIC_DELIVERY_RATE_LIMIT_EXCEEDED',
    message: 'Too many delivery requests from this IP, please try again shortly'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 requests per 10 minutes
  message: {
    success: false,
    errorCode: 'OTP_REQUEST_RATE_LIMIT_EXCEEDED',
    message: 'Too many OTP requests from this IP address. Please wait before requesting another OTP.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 verification attempts per 10 minutes
  message: {
    success: false,
    errorCode: 'OTP_VERIFY_RATE_LIMIT_EXCEEDED',
    message: 'Too many OTP verification attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});



