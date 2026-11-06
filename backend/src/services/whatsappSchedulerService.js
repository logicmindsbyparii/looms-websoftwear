import { WhatsAppConfig } from '../models/WhatsAppConfig.js';
import { WhatsAppRecipient } from '../models/WhatsAppRecipient.js';
import { sendWhatsAppMessage } from './whatsappApiService.js';
import { REPORT_GENERATORS } from './whatsappReportService.js';
import { logger } from '../utils/logger.js';

let schedulerInterval = null;

function getCurrentTimeIST() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date()); // e.g. "08:00"
}

function getCurrentDateIST() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // "06/11/2026"
}

/**
 * Check and dispatch all due scheduled reports for the current minute
 */
export async function checkAndDispatchScheduledReports() {
  try {
    const config = await WhatsAppConfig.findOne();
    if (!config || !config.isEnabled) return;

    const currentTime = getCurrentTimeIST(); // "HH:mm"
    const currentDate = getCurrentDateIST();

    const schedules = config.reportSchedules || [];

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      // Check if scheduled time matches current minute
      if (schedule.time === currentTime) {
        // Deduplication check: did we already send this report today?
        if (schedule.lastSentAt) {
          const lastSentDate = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(schedule.lastSentAt);

          if (lastSentDate === currentDate) {
            // Already sent today
            continue;
          }
        }

        const generator = REPORT_GENERATORS[schedule.reportId];
        if (!generator) {
          logger.warn(`No report generator registered for ID: ${schedule.reportId}`);
          continue;
        }

        logger.info(`⏰ Automated Scheduler triggering: ${schedule.name} at ${currentTime} IST...`);

        // Generate report content from live DB
        const reportContent = await generator();

        // Find active recipients subscribed to this report or role
        const targetRoles = schedule.targetRoles || ['Admin', 'Owner'];
        const recipients = await WhatsAppRecipient.find({
          isActive: true,
          $or: [
            { subscribedReports: schedule.reportId },
            { role: { $in: targetRoles } }
          ]
        });

        if (recipients.length === 0) {
          logger.info(`No active recipients for scheduled report: ${schedule.reportId}`);
          schedule.lastSentAt = new Date();
          await config.save();
          continue;
        }

        // Dispatch report to each recipient
        for (const recipient of recipients) {
          await sendWhatsAppMessage({
            to: recipient.phone,
            recipientName: recipient.name,
            text: reportContent,
            messageType: 'report',
            title: schedule.name,
            metadata: {
              reportId: schedule.reportId,
              frequency: schedule.frequency,
              scheduledTime: schedule.time,
              recipientId: recipient.id,
              recipientRole: recipient.role,
              automated: true
            }
          });
        }

        // Mark last sent timestamp for deduplication
        schedule.lastSentAt = new Date();
        await config.save();
        logger.info(`✅ Successfully dispatched ${schedule.name} to ${recipients.length} recipients.`);
      }
    }
  } catch (err) {
    logger.error('Error in WhatsApp scheduler loop:', err.message);
  }
}

/**
 * Initialize the WhatsApp automated scheduler
 */
export function initWhatsAppScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Run check every 60 seconds
  schedulerInterval = setInterval(() => {
    checkAndDispatchScheduledReports();
  }, 60000);

  logger.info('🕒 WhatsApp AI Report Scheduler initialized (Timezone: Asia/Kolkata, Tick: 60s)');
}

