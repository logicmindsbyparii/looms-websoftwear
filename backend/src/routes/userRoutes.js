import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  adminUnlockUser,
  adminForceLogoutUser
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('Admin')); // All user management endpoints are Admin only

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .patch(updateUser)
  .delete(deleteUser);

router.post('/:id/reset-password', adminResetPassword);
router.post('/:id/unlock', adminUnlockUser);
router.post('/:id/force-logout', adminForceLogoutUser);

export default router;

