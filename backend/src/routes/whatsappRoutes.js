import { Router } from 'express';
import {
  getConfig,
  updateConfig,
  getRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  sendTestMessage,
  sendManualReport,
  askAiAssistant,
  getLogs,
  retryMessage,
  getAnalytics,
  verifyWebhook,
  handleWebhookEvent
} from '../controllers/whatsappController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

// ==========================================
// Meta WhatsApp Cloud API Webhook Endpoints
// Publicly reachable by Meta Webhook servers
// ==========================================
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhookEvent);

// ==========================================
// Protected LOOMUS Administrative Endpoints
// ==========================================
router.use(authMiddleware);

// Configuration & Connection status
router.get('/config', requireRole('Admin', 'Supervisor'), getConfig);
router.put('/config', requireRole('Admin'), updateConfig);

// Recipients management
router.get('/recipients', requireRole('Admin', 'Supervisor'), getRecipients);
router.post('/recipients', requireRole('Admin'), createRecipient);
router.put('/recipients/:id', requireRole('Admin'), updateRecipient);
router.delete('/recipients/:id', requireRole('Admin'), deleteRecipient);

// Manual dispatch & testing
router.post('/test', requireRole('Admin', 'Supervisor'), sendTestMessage);
router.post('/send-report', requireRole('Admin', 'Supervisor'), sendManualReport);
router.post('/ask-ai', requireRole('Admin', 'Supervisor'), askAiAssistant);

// Message logs, analytics & retry
router.get('/logs', requireRole('Admin', 'Supervisor'), getLogs);
router.post('/retry/:logId', requireRole('Admin', 'Supervisor'), retryMessage);
router.get('/analytics', requireRole('Admin', 'Supervisor'), getAnalytics);

export default router;

