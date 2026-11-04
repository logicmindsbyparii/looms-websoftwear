import { Router } from 'express';
import {
  getAlarms,
  createAlarm,
  addTestAlarm,
  ackAlarm,
  ackAllAlarms
} from '../controllers/alarmController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.route('/')
  .get(getAlarms)
  .post(createAlarm);

router.post('/test', addTestAlarm);
router.post('/ack-all', ackAllAlarms);
router.post('/:id/ack', ackAlarm);
router.delete('/:id', ackAlarm);

export default router;

