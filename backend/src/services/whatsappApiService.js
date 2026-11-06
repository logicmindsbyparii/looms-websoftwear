import mongoose from 'mongoose';
import { WhatsAppConfig } from '../models/WhatsAppConfig.js';
import { WhatsAppLog } from '../models/WhatsAppLog.js';
import { logger } from '../utils/logger.js';

/**
 * Clean and standardize phone number to international E.164 format (e.g. 919664683069)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  // If 11 digits starting with 0 (Indian 0-prefix like 09876543210), strip 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) return `91${digits}`; // Default to India (+91)
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

/**
 * Get active WhatsApp configuration (from DB or .env fallback)
 */
export async function getActiveConfig() {
  try {
    let config = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      config = await WhatsAppConfig.findOne();
      if (!config) {
        config = await WhatsAppConfig.create({
          apiToken: process.env.WHATSAPP_API_TOKEN || '',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
          businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
          webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'loomus_webhook_verify_token_secure_2026',
          apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
        });
      }
    }

    // Check if live credentials exist (either in config or in env)
    const token = (config && config.apiToken) || process.env.WHATSAPP_API_TOKEN;
    const phoneId = (config && config.phoneNumberId) || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const isLive = Boolean(token && phoneId);

    return {
      config,
      token,
      phoneId,
      apiVersion: (config && config.apiVersion) || process.env.WHATSAPP_API_VERSION || 'v21.0',
      isLive,
      webhookVerifyToken: (config && config.webhookVerifyToken) || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'loomus_webhook_verify_token_secure_2026'
    };
  } catch (err) {
    logger.warn('Failed to load WhatsAppConfig from DB, using env fallback:', err.message);
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return {
      config: null,
      token,
      phoneId,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
      isLive: Boolean(token && phoneId),
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'loomus_webhook_verify_token_secure_2026'
    };
  }
}

/**
 * Send WhatsApp message using Meta WhatsApp Business Cloud API (or simulated logger if unconfigured)
 */
export async function sendWhatsAppMessage({
  to,
  recipientName = '',
  text,
  messageType = 'report',
  title = 'LOOMUS Notification',
  metadata = {}
}) {
  const cleanPhone = formatPhoneNumber(to);
  if (!cleanPhone) {
    throw new Error('Invalid recipient phone number');
  }

  const { token, phoneId, apiVersion, isLive } = await getActiveConfig();
  const logId = `WAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 1. If Meta credentials are provided, call Meta Cloud API
  if (isLive) {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Meta API Error (${response.status})`;
        logger.error(`Meta WhatsApp API call failed for ${cleanPhone}:`, errorMsg);

        // Record failed log
        const log = await WhatsAppLog.create({
          id: logId,
          direction: 'outbound',
          recipientPhone: cleanPhone,
          recipientName,
          messageType,
          title,
          content: text,
          status: 'failed',
          error: errorMsg,
          metadata
        });

        return { success: false, error: errorMsg, log };
      }

      const metaMessageId = data?.messages?.[0]?.id || '';
      logger.info(`WhatsApp message successfully sent via Meta API to ${cleanPhone} (ID: ${metaMessageId})`);

      // Record successful log
      const log = await WhatsAppLog.create({
        id: logId,
        direction: 'outbound',
        recipientPhone: cleanPhone,
        recipientName,
        messageType,
        title,
        content: text,
        status: 'sent',
        metaMessageId,
        metadata
      });

      return { success: true, metaMessageId, log };
    } catch (err) {
      logger.error(`Network error calling Meta WhatsApp API for ${cleanPhone}:`, err.message);
      const log = await WhatsAppLog.create({
        id: logId,
        direction: 'outbound',
        recipientPhone: cleanPhone,
        recipientName,
        messageType,
        title,
        content: text,
        status: 'failed',
        error: err.message,
        metadata
      });
      return { success: false, error: err.message, log };
    }
  }

  // 2. Simulated Mode (when Meta credentials not configured yet)
  // Allows testing the complete end-to-end report system, UI logs, retry, and scheduler
  logger.info(`[SIMULATION MODE] WhatsApp message to +${cleanPhone}: \n${text.slice(0, 150)}...`);

  const log = await WhatsAppLog.create({
    id: logId,
    direction: 'outbound',
    recipientPhone: cleanPhone,
    recipientName,
    messageType,
    title,
    content: text,
    status: 'sent',
    metaMessageId: `SIM-WID-${Date.now()}`,
    metadata: {
      ...metadata,
      simulated: true,
      note: 'Sent in Simulated Mode (Configure Meta API credentials in WhatsApp AI Settings for live delivery)'
    }
  });

  return {
    success: true,
    simulated: true,
    metaMessageId: log.metaMessageId,
    log
  };
}

/**
 * Retry a previously failed message
 */
export async function retryWhatsAppMessage(logId) {
  const existing = await WhatsAppLog.findOne({ id: logId });
  if (!existing) {
    throw new Error('Message log not found');
  }

  const result = await sendWhatsAppMessage({
    to: existing.recipientPhone,
    recipientName: existing.recipientName,
    text: existing.content,
    messageType: existing.messageType,
    title: existing.title,
    metadata: {
      ...existing.metadata,
      retriedFrom: existing.id
    }
  });

  if (result.success) {
    existing.status = 'sent';
    existing.retryCount = (existing.retryCount || 0) + 1;
    existing.error = '';
    await existing.save();
  } else {
    existing.retryCount = (existing.retryCount || 0) + 1;
    existing.error = result.error;
    await existing.save();
  }

  return { success: result.success, log: existing };
}

/**
 * Handle incoming webhook status updates from Meta (delivered, read, failed)
 */
export async function handleWebhookStatus(statusUpdate) {
  const messageId = statusUpdate?.id;
  const status = statusUpdate?.status; // 'sent', 'delivered', 'read', 'failed'
  if (!messageId || !status) return null;

  try {
    const log = await WhatsAppLog.findOne({ metaMessageId: messageId });
    if (log) {
      log.status = status;
      if (status === 'failed') {
        const errorDesc = statusUpdate?.errors?.[0]?.message || 'Delivery failed';
        log.error = errorDesc;
      }
      await log.save();
      logger.info(`Updated WhatsApp status for ${messageId} -> ${status}`);
      return log;
    }
  } catch (err) {
    logger.warn('Failed to update WhatsApp webhook status:', err.message);
  }
  return null;
}
