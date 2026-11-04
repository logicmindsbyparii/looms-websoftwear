import { Router } from 'express';
import { getStock, addRawMaterial, deleteStock } from '../controllers/stockController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getStock)
  .post(requireRole('Admin', 'Supervisor'), addRawMaterial);

router.delete('/:id', requireRole('Admin', 'Supervisor'), deleteStock);

export default router;

