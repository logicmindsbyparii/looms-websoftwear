import { Router } from 'express';
import { getBrokers, addBroker, deleteBroker } from '../controllers/brokerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getBrokers)
  .post(requireRole('Admin'), addBroker);

router.delete('/:id', requireRole('Admin'), deleteBroker);

export default router;

