import { Router } from 'express';
import {
  login,
  login2FA,
  refresh,
  logout,
  logoutAll,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  setup2FA,
  verifyEnable2FA,
  disable2FA,
  getSessions,
  revokeSession,
  viewAs,
  updatePreferredLanguage
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public auth routes (rate limited)
router.post('/login', authLimiter, login);
router.post('/2fa/login', authLimiter, login2FA);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Authenticated routes
router.use(authMiddleware);

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.patch('/change-password', changePassword);
router.patch('/language', updatePreferredLanguage);

// 2FA management
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify-enable', verifyEnable2FA);
router.post('/2fa/disable', disable2FA);

// Active device sessions
router.get('/sessions', getSessions);
router.delete('/sessions/:id', revokeSession);

// Admin-only View-As (Role Preview)
router.post('/view-as', requireRole('Admin'), viewAs);

export default router;

