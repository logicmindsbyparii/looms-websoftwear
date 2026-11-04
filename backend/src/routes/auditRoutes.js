import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('Admin'));

router.get('/', getAuditLogs);

export default router;

