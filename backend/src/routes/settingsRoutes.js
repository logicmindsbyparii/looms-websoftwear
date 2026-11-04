import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getSettings)
  .put(requireRole('Admin'), updateSettings)
  .patch(requireRole('Admin'), updateSettings);

export default router;

