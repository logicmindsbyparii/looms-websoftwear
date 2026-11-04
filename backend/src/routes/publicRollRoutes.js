import { Router } from 'express';
import { getPublicRoll } from '../controllers/publicRollController.js';
import { publicRollLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public Roll Lookup by QR token or Roll ID (TK-...)
// No auth required, strictly rate-limited, noindexing headers applied
router.get('/:code', publicRollLimiter, getPublicRoll);

export default router;
