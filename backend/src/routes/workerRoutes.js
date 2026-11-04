import { Router } from 'express';
import {
  getWorkers,
  createWorker,
  updateWorker,
  updateWorkerStatus,
  deleteWorker
} from '../controllers/workerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getWorkers)
  .post(requireRole('Admin', 'Supervisor'), createWorker);

router.route('/:id')
  .put(requireRole('Admin', 'Supervisor'), updateWorker)
  .delete(requireRole('Admin', 'Supervisor'), deleteWorker);

router.patch('/:id/status', requireRole('Admin', 'Supervisor'), updateWorkerStatus);

export default router;

