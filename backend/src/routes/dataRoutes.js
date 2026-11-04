import { Router } from 'express';
import {
  exportData,
  importData,
  loadDemoData,
  clearAllData
} from '../controllers/dataController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/export', exportData);
router.post('/import', requireRole('Admin'), importData);
router.post('/demo', requireRole('Admin'), loadDemoData);
router.delete('/clear', requireRole('Admin'), clearAllData);

export default router;

