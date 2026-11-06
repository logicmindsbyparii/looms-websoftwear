import { WhatsAppConfig } from '../models/WhatsAppConfig.js';
import { WhatsAppRecipient } from '../models/WhatsAppRecipient.js';
import { WhatsAppLog } from '../models/WhatsAppLog.js';
import { sendWhatsAppMessage, retryWhatsAppMessage, handleWebhookStatus, getActiveConfig, formatPhoneNumber } from '../services/whatsappApiService.js';
import { REPORT_GENERATORS } from '../services/whatsappReportService.js';
import { processAiQuery } from '../services/whatsappAiService.js';
import { logger } from '../utils/logger.js';

// Mask token for frontend display
function maskToken(token = '') {
  if (!token) return '';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * GET /api/whatsapp/config
 */
export async function getConfig(req, res) {
  try {
    const { config, isLive } = await getActiveConfig();
    const safeConfig = config.toObject();

    // Mask sensitive token
    safeConfig.apiTokenMasked = maskToken(safeConfig.apiToken);
    safeConfig.isLiveConfigured = isLive;
    delete safeConfig.apiToken; // Never send raw token to frontend

    res.json({ success: true, data: safeConfig });
  } catch (err) {
    logger.error('Error getting WhatsApp config:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/whatsapp/config
 */
export async function updateConfig(req, res) {
  try {
    let config = await WhatsAppConfig.findOne();
    if (!config) config = new WhatsAppConfig();

    const {
      isEnabled,
      apiToken,
      phoneNumberId,
      businessAccountId,
      webhookVerifyToken,
      apiVersion,
      reportSchedules,
      alertRules,
      aiAssistant
    } = req.body;

    if (typeof isEnabled === 'boolean') config.isEnabled = isEnabled;
    if (apiToken && !apiToken.includes('...')) config.apiToken = apiToken.trim();
    if (phoneNumberId !== undefined) config.phoneNumberId = phoneNumberId.trim();
    if (businessAccountId !== undefined) config.businessAccountId = businessAccountId.trim();
    if (webhookVerifyToken !== undefined) config.webhookVerifyToken = webhookVerifyToken.trim();
    if (apiVersion !== undefined) config.apiVersion = apiVersion.trim();
    if (Array.isArray(reportSchedules)) config.reportSchedules = reportSchedules;
    if (Array.isArray(alertRules)) config.alertRules = alertRules;
    if (aiAssistant) config.aiAssistant = { ...config.aiAssistant, ...aiAssistant };

    await config.save();
    logger.info('WhatsApp configuration updated by admin.');

    const safeConfig = config.toObject();
    safeConfig.apiTokenMasked = maskToken(safeConfig.apiToken);
    delete safeConfig.apiToken;

    res.json({ success: true, message: 'Configuration updated successfully', data: safeConfig });
  } catch (err) {
    logger.error('Error updating WhatsApp config:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/whatsapp/recipients
 */
export async function getRecipients(req, res) {
  try {
    let recipients = await WhatsAppRecipient.find().sort({ createdAt: -1 });

    // Seed default admin recipient if empty
    if (recipients.length === 0) {
      const defaultAdmin = await WhatsAppRecipient.create({
        id: `REC-${Date.now()}`,
        name: 'Mill General Manager',
        phone: process.env.WHATSAPP_ADMIN_PHONE || '+91 75675 74107',
        role: 'Admin',
        isActive: true,
        notes: 'Primary factory administration channel'
      });
      recipients = [defaultAdmin];
    }

    res.json({ success: true, data: recipients });
  } catch (err) {
    logger.error('Error fetching WhatsApp recipients:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/whatsapp/recipients
 */
export async function createRecipient(req, res) {
  try {
    const { name, phone, role, subscribedReports, subscribedAlerts, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const cleanPhone = formatPhoneNumber(phone);
    const existing = await WhatsAppRecipient.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A recipient with this phone number already exists' });
    }

    const recipient = await WhatsAppRecipient.create({
      id: `REC-${Date.now()}`,
      name: name.trim(),
      phone: cleanPhone,
      role: role || 'Admin',
      subscribedReports: subscribedReports || ['daily_production', 'daily_factory_summary'],
      subscribedAlerts: subscribedAlerts || ['loom_stop', 'production_low'],
      notes: notes || '',
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Recipient added successfully', data: recipient });
  } catch (err) {
    logger.error('Error creating WhatsApp recipient:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/whatsapp/recipients/:id
 */
export async function updateRecipient(req, res) {
  try {
    const { id } = req.params;
    const recipient = await WhatsAppRecipient.findOne({ id });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const { name, phone, role, subscribedReports, subscribedAlerts, isActive, notes } = req.body;
    if (name) recipient.name = name.trim();
    if (phone) recipient.phone = formatPhoneNumber(phone);
    if (role) recipient.role = role;
    if (Array.isArray(subscribedReports)) recipient.subscribedReports = subscribedReports;
    if (Array.isArray(subscribedAlerts)) recipient.subscribedAlerts = subscribedAlerts;
    if (typeof isActive === 'boolean') recipient.isActive = isActive;
    if (notes !== undefined) recipient.notes = notes;

    await recipient.save();
    res.json({ success: true, message: 'Recipient updated', data: recipient });
  } catch (err) {
    logger.error('Error updating WhatsApp recipient:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/whatsapp/recipients/:id
 */
export async function deleteRecipient(req, res) {
  try {
    const { id } = req.params;
    const deleted = await WhatsAppRecipient.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    res.json({ success: true, message: 'Recipient deleted' });
  } catch (err) {
    logger.error('Error deleting recipient:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/whatsapp/test
 * Send test message to check connection
 */
export async function sendTestMessage(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const text = `✅ *LOOMUS WhatsApp Business API Connected!*
----------------------------------------
🏭 *Facility:* LOOMUS Advanced Weaving Facility
📅 *Date:* ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
🕒 *Time:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
----------------------------------------
✨ Automated AI Reports and Real-Time Alerts are active.
🤖 You can now reply to this chat to ask any factory questions in English, Hindi, or Gujarati!`;

    const result = await sendWhatsAppMessage({
      to: phone,
      recipientName: 'Test Recipient',
      text,
      messageType: 'test',
      title: 'WhatsApp API Connection Test',
      metadata: { test: true }
    });

    res.json({ success: true, message: 'Test message processed', data: result });
  } catch (err) {
    logger.error('Error sending test WhatsApp message:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/whatsapp/send-report
 * Manually dispatch any of the 11 reports to chosen recipient or role
 */
export async function sendManualReport(req, res) {
  try {
    const { reportId, phone, role } = req.body;
    const generator = REPORT_GENERATORS[reportId];

    if (!generator) {
      return res.status(400).json({ success: false, message: `Invalid reportId: ${reportId}` });
    }

    const reportContent = await generator();
    const targets = [];

    if (phone) {
      targets.push({ phone, name: 'Direct Dispatch' });
    } else if (role) {
      const roleRecipients = await WhatsAppRecipient.find({ role, isActive: true });
      targets.push(...roleRecipients);
    } else {
      // Send to all active subscribers of this report or Admins
      const subscribers = await WhatsAppRecipient.find({
        isActive: true,
        $or: [
          { subscribedReports: reportId },
          { role: 'Admin' }
        ]
      });
      targets.push(...subscribers);
    }

    if (targets.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients found for this dispatch' });
    }

    const results = [];
    for (const t of targets) {
      const sendRes = await sendWhatsAppMessage({
        to: t.phone,
        recipientName: t.name || '',
        text: reportContent,
        messageType: 'report',
        title: `Manual Report: ${reportId}`,
        metadata: { reportId, manual: true }
      });
      results.push(sendRes);
    }

    res.json({
      success: true,
      message: `Report sent to ${targets.length} recipient(s)`,
      count: targets.length,
      data: results
    });
  } catch (err) {
    logger.error('Error sending manual report:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/whatsapp/ask-ai
 * Test the AI assistant from dashboard
 */
export async function askAiAssistant(req, res) {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query text is required' });
    }

    const answer = await processAiQuery(query);
    res.json({ success: true, query, answer });
  } catch (err) {
    logger.error('Error testing AI query:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/whatsapp/logs
 */
export async function getLogs(req, res) {
  try {
    const { page = 1, limit = 50, direction, messageType, status, search } = req.query;
    const filter = {};

    if (direction) filter.direction = direction;
    if (messageType) filter.messageType = messageType;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { recipientPhone: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      WhatsAppLog.find(filter).sort({ sentAt: -1 }).skip(skip).limit(Number(limit)),
      WhatsAppLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error('Error fetching WhatsApp logs:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/whatsapp/retry/:logId
 */
export async function retryMessage(req, res) {
  try {
    const { logId } = req.params;
    const result = await retryWhatsAppMessage(logId);
    res.json({ success: result.success, message: result.success ? 'Message retried successfully' : 'Retry failed', data: result.log });
  } catch (err) {
    logger.error('Error retrying message:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/whatsapp/analytics
 */
export async function getAnalytics(req, res) {
  try {
    const [total, sent, delivered, read, failed, totalInbound] = await Promise.all([
      WhatsAppLog.countDocuments(),
      WhatsAppLog.countDocuments({ status: 'sent' }),
      WhatsAppLog.countDocuments({ status: 'delivered' }),
      WhatsAppLog.countDocuments({ status: 'read' }),
      WhatsAppLog.countDocuments({ status: 'failed' }),
      WhatsAppLog.countDocuments({ direction: 'inbound' })
    ]);

    const reportCount = await WhatsAppLog.countDocuments({ messageType: 'report' });
    const alertCount = await WhatsAppLog.countDocuments({ messageType: 'alert' });
    const aiCount = await WhatsAppLog.countDocuments({ messageType: 'ai_assistant' });

    res.json({
      success: true,
      data: {
        total,
        sent,
        delivered,
        read,
        failed,
        totalInbound,
        breakdown: {
          report: reportCount,
          alert: alertCount,
          ai_assistant: aiCount
        },
        deliverySuccessRate: total > 0 ? (((total - failed) / total) * 100).toFixed(1) : '100'
      }
    });
  } catch (err) {
    logger.error('Error fetching analytics:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook verification handshake
 */
export async function verifyWebhook(req, res) {
  try {
    const { webhookVerifyToken } = await getActiveConfig();
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === webhookVerifyToken) {
      logger.info('Meta WhatsApp webhook verification successful!');
      return res.status(200).send(challenge);
    }

    logger.warn('Meta WhatsApp webhook verification failed (token mismatch).');
    return res.status(403).json({ error: 'Verification token mismatch' });
  } catch (err) {
    logger.error('Error in webhook verification:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/whatsapp/webhook
 * Meta Webhook receiver for incoming messages and delivery receipts
 */
export async function handleWebhookEvent(req, res) {
  try {
    const body = req.body;

    // Fast 200 OK response required by Meta
    res.status(200).send('EVENT_RECEIVED');

    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // 1. Handle Delivery Status Receipts
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            await handleWebhookStatus(statusObj);
          }
        }

        // 2. Handle Incoming WhatsApp User Messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            const senderPhone = msg.from;
            const messageText = msg.text?.body || '';

            if (!senderPhone || !messageText) continue;

            logger.info(`Incoming WhatsApp question from +${senderPhone}: "${messageText}"`);

            // Log inbound query
            await WhatsAppLog.create({
              id: `IN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              direction: 'inbound',
              recipientPhone: senderPhone,
              recipientName: value.contacts?.[0]?.profile?.name || 'WhatsApp User',
              messageType: 'ai_assistant',
              title: 'Incoming AI Question',
              content: messageText,
              status: 'delivered',
              metaMessageId: msg.id
            });

            // Process with Multilingual AI Assistant
            const aiReply = await processAiQuery(messageText);

            // Send answer back through Meta API
            await sendWhatsAppMessage({
              to: senderPhone,
              recipientName: value.contacts?.[0]?.profile?.name || '',
              text: aiReply,
              messageType: 'ai_assistant',
              title: 'LOOMUS AI Assistant Reply',
              metadata: { inReplyTo: msg.id }
            });
          }
        }
      }
    }
  } catch (err) {
    logger.error('Error handling WhatsApp webhook event:', err.message);
  }
}
