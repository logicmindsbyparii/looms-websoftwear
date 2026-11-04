import { Router } from 'express';
import {
  getProductionLogs,
  addProductionLog,
  deleteProductionLog
} from '../controllers/productionLogController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getProductionLogs)
  .post(addProductionLog);

router.delete('/:id', requireRole('Admin', 'Supervisor'), deleteProductionLog);

export default router;

