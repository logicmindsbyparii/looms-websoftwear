import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} from '../controllers/locationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requirePermission } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.LOCATIONS_READ), getLocations);
router.get('/:id', requirePermission(PERMISSIONS.LOCATIONS_READ), getLocationById);

router.post('/', requireRole('Admin'), createLocation);
router.patch('/:id', requireRole('Admin'), updateLocation);
router.delete('/:id', requireRole('Admin'), deleteLocation);

export default router;

