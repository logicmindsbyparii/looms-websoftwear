import { Router } from 'express';
import {
  createDispatch,
  getDispatches,
  getDispatchDetails,
  updateTransit,
  resolveDispute
} from '../controllers/dispatchController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requirePermission } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(requirePermission(PERMISSIONS.DISPATCH_READ), getDispatches)
  .post(requirePermission(PERMISSIONS.DISPATCH_CREATE), createDispatch);

router.get('/:id', requirePermission(PERMISSIONS.DISPATCH_READ), getDispatchDetails);

// Driver / transit updates (Driver, Supervisor, Admin)
router.patch('/:id/transit', requirePermission(PERMISSIONS.DISPATCH_TRANSIT_UPDATE), updateTransit);

// Admin-only dispute resolution
router.post('/:id/resolve-dispute', requireRole('Admin'), resolveDispute);

export default router;
