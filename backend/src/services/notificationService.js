/**
 * Secure Notification & Messaging Service for LOOMUS / LoomTrack
 * Handles party OTP delivery, WhatsApp links, and Admin alerts.
 */
import { emitToAll } from './socketService.js';

export async function sendPartyDeliveryOTP({ phone, otp, dispatchId, partyName }) {
  const isProd = process.env.NODE_ENV === 'production';
  const provider = process.env.SMS_GATEWAY_PROVIDER || 'none';

  const messageText = `LOOMUS Textile Mill: Your delivery verification OTP for Dispatch ${dispatchId} is ${otp}. Valid for 5 minutes. Do not share with driver.`;

  // Real SMS Provider Integration (if configured)
  if (provider === 'fast2sms' && process.env.SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone.replace(/\D/g, '')
        })
      });
      const data = await response.json();
      return { success: data.return === true, provider: 'fast2sms' };
    } catch (err) {
      console.error('[SMS Service Error]', err.message);
      return { success: false, error: err.message, provider: 'fast2sms' };
    }
  }

  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: messageText
          })
        }
      );
      const data = await response.json();
      return { success: !!data.sid, provider: 'twilio' };
    } catch (err) {
      console.error('[Twilio SMS Error]', err.message);
      return { success: false, error: err.message, provider: 'twilio' };
    }
  }

  // If no external provider is configured
  if (!isProd && (process.env.ALLOW_DEV_MOCK_OTP === 'true' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
    console.log(`\n========================================`);
    console.log(`[DEVELOPMENT OTP DISPATCH SIMULATION]`);
    console.log(`Recipient: ${partyName} (${phone})`);
    console.log(`Dispatch ID: ${dispatchId}`);
    console.log(`Secure OTP: ${otp} (Valid 5 mins)`);
    console.log(`========================================\n`);
    return { success: true, simulated: true, provider: 'development-mock' };
  }

  // Provider not configured in production
  console.warn(`[SMS Service Warning] SMS Gateway not configured. OTP not delivered to ${phone}`);
  return { success: false, error: 'SMS gateway not configured', provider: 'none' };
}

export async function notifyAdminEvent({ eventType, dispatch, details = {} }) {
  // Emit real-time notification to active admin socket sessions
  emitToAll('delivery:admin_alert', {
    eventType,
    dispatchId: dispatch.dispatchId,
    partyName: dispatch.partyName,
    status: dispatch.status,
    timestamp: new Date().toISOString(),
    details
  });

  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || '+91 75675 74107';

  // Log to audit logger
  console.log(`[ADMIN NOTIFICATION ALERT] Event: ${eventType} | Dispatch: ${dispatch.dispatchId} | Status: ${dispatch.status} | Target: ${adminPhone}`);
}

