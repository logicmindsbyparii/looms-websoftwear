import { Router } from 'express';
import {
  getCameras,
  addCamera,
  toggleCamera,
  deleteCamera
} from '../controllers/cameraController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getCameras)
  .post(requireRole('Admin', 'Supervisor'), addCamera);

router.patch('/:id/toggle', requireRole('Admin', 'Supervisor'), toggleCamera);
router.delete('/:id', requireRole('Admin', 'Supervisor'), deleteCamera);

export default router;

