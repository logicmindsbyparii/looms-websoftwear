import { Router } from 'express';
import { getReadyGoods, addReadyGoods, deleteReadyGoods } from '../controllers/readyGoodsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getReadyGoods)
  .post(requireRole('Admin', 'Supervisor'), addReadyGoods);

router.delete('/:id', requireRole('Admin', 'Supervisor'), deleteReadyGoods);

export default router;

