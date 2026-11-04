import { Router } from 'express';
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  updateMachineStatus,
  startAllMachines,
  stopAllMachines,
  emergencyStopAll
} from '../controllers/machineController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, checkMachineOwnership } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/start-all', requireRole('Admin', 'Supervisor'), startAllMachines);
router.post('/stop-all', requireRole('Admin', 'Supervisor'), stopAllMachines);
router.post('/emergency-stop', emergencyStopAll);

router.route('/')
  .get(getMachines)
  .post(requireRole('Admin', 'Supervisor'), createMachine);

router.route('/:id')
  .get(getMachineById)
  .put(requireRole('Admin', 'Supervisor'), updateMachine)
  .delete(requireRole('Admin', 'Supervisor'), deleteMachine);

router.patch('/:id/status', checkMachineOwnership, updateMachineStatus);

export default router;

