import { Router } from 'express';
import {
  getRolls,
  getRollsSummary,
  getRollById,
  scanStaffRoll,
  createRoll,
  bulkCreateRolls,
  transferRoll,
  updateRollStatus,
  reissueQr,
  correctMetres,
  voidRoll
} from '../controllers/rollController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requirePermission, checkMachineOwnership } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.use(authMiddleware);

// Summary & list
router.get('/summary', requirePermission(PERMISSIONS.ROLLS_READ), getRollsSummary);
router.get('/scan/:code', requirePermission(PERMISSIONS.ROLLS_READ), scanStaffRoll);
router.get('/', requirePermission(PERMISSIONS.ROLLS_READ), getRolls);
router.get('/:id', requirePermission(PERMISSIONS.ROLLS_READ), getRollById);

// Creation
router.post('/', requirePermission(PERMISSIONS.ROLLS_CREATE), checkMachineOwnership, createRoll);
router.post('/bulk', requireRole('Admin', 'Supervisor'), bulkCreateRolls);

// Movement & Status
router.post('/:id/transfer', requirePermission(PERMISSIONS.ROLLS_MOVE), requireRole('Admin', 'Supervisor'), transferRoll);
router.post('/:id/status', requirePermission(PERMISSIONS.ROLLS_STATUS), requireRole('Admin', 'Supervisor'), updateRollStatus);

// Management
router.post('/:id/reissue-qr', requireRole('Admin', 'Supervisor'), reissueQr);
router.post('/:id/correct-metres', requireRole('Admin'), correctMetres);
router.post('/:id/void', requireRole('Admin'), voidRoll);

export default router;
