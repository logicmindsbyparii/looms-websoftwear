import { Router } from 'express';
import {
  getSalesOrders,
  addSalesOrder,
  updateOrderStatus,
  deleteSalesOrder
} from '../controllers/salesOrderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getSalesOrders)
  .post(requireRole('Admin'), addSalesOrder);

router.patch('/:id/status', requireRole('Admin'), updateOrderStatus);
router.delete('/:id', requireRole('Admin'), deleteSalesOrder);

export default router;

