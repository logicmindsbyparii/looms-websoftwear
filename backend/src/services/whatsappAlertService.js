import { WhatsAppConfig } from '../models/WhatsAppConfig.js';
import { WhatsAppRecipient } from '../models/WhatsAppRecipient.js';
import { sendWhatsAppMessage } from './whatsappApiService.js';
import { logger } from '../utils/logger.js';

// In-memory cooldown tracker to avoid duplicate spamming
const alertCooldowns = new Map();

function isCoolingDown(key, cooldownMinutes = 30) {
  const lastTime = alertCooldowns.get(key);
  if (!lastTime) return false;
  const diffMinutes = (Date.now() - lastTime) / (1000 * 60);
  return diffMinutes < cooldownMinutes;
}

function setCooldown(key) {
  alertCooldowns.set(key, Date.now());
}

/**
 * Trigger an alert to all recipients registered for this alert type or role
 */
export async function triggerSmartAlert({ alertId, title, message, metadata = {} }) {
  try {
    const config = await WhatsAppConfig.findOne();
    if (!config || !config.isEnabled) return { skipped: true, reason: 'WhatsApp disabled' };

    const rule = config.alertRules?.find(r => r.alertId === alertId);
    if (!rule || !rule.enabled) return { skipped: true, reason: 'Alert rule disabled' };

    const cooldownKey = `${alertId}:${metadata?.loomId || metadata?.stockId || 'global'}`;
    const cooldownMins = rule.cooldownMinutes || 30;

    if (isCoolingDown(cooldownKey, cooldownMins)) {
      logger.info(`Alert ${alertId} (${cooldownKey}) suppressed by cooldown (${cooldownMins}m).`);
      return { skipped: true, reason: 'Cooldown active' };
    }

    setCooldown(cooldownKey);
    rule.lastTriggeredAt = new Date();
    await config.save();

    // Find active recipients subscribed to this alert or matching target roles
    const targetRoles = rule.targetRoles || ['Admin', 'Supervisor'];
    const recipients = await WhatsAppRecipient.find({
      isActive: true,
      $or: [
        { subscribedAlerts: alertId },
        { role: { $in: targetRoles } }
      ]
    });

    if (recipients.length === 0) {
      logger.info(`No active WhatsApp recipients found for alert: ${alertId}`);
      return { skipped: true, reason: 'No recipients' };
    }

    logger.info(`Dispatching smart alert "${alertId}" to ${recipients.length} recipients...`);

    const results = [];
    for (const recipient of recipients) {
      const res = await sendWhatsAppMessage({
        to: recipient.phone,
        recipientName: recipient.name,
        text: `🚨 *LOOMUS FACTORY ALERT*\n${title}\n----------------------------------------\n${message}\n----------------------------------------\n🕒 ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} | LOOMUS AI Automation`,
        messageType: 'alert',
        title,
        metadata: {
          alertId,
          recipientId: recipient.id,
          recipientRole: recipient.role,
          ...metadata
        }
      });
      results.push(res);
    }

    return { success: true, count: recipients.length, results };
  } catch (err) {
    logger.error(`Error triggering smart alert ${alertId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Loom Unexpected Stop Alert
 */
export async function checkLoomStopAlert(machine, previousStatus = 'running') {
  if (machine.status === 'stopped' && previousStatus === 'running') {
    return triggerSmartAlert({
      alertId: 'loom_stop',
      title: `⚠️ LOOM UNEXPECTEDLY STOPPED: ${machine.id}`,
      message: `⚙️ *Loom:* ${machine.id} (${machine.name || 'Airjet'})\n🧵 *Fabric:* ${machine.fabric || 'Standard'}\n📍 *Shed:* ${machine.shed || 'Main Shed'}\n👤 *Operator:* ${machine.operator || 'Floor Operator'}\n⚡ *RPM dropped to:* ${machine.rpm || 0} RPM\n\nImmediate inspection recommended!`,
      metadata: { loomId: machine.id }
    });
  }
}

/**
 * 2. Production Below Target Alert
 */
export async function checkProductionLowAlert(machine) {
  const target = machine.targetOutput || 75;
  const current = machine.output || 0;
  const pct = target > 0 ? (current / target) * 100 : 100;

  if (pct < 70 && machine.status === 'running') {
    return triggerSmartAlert({
      alertId: 'production_low',
      title: `🔻 PRODUCTION DEFICIT ALERT: ${machine.id}`,
      message: `⚙️ *Loom:* ${machine.id}\n📉 *Current Output:* ${current} m\n🎯 *Target:* ${target} m (${pct.toFixed(1)}% of quota)\n🧵 *Fabric:* ${machine.fabric}\n⚡ *RPM:* ${machine.rpm}\n\nLoom running substantially below production quota.`,
      metadata: { loomId: machine.id, output: current, target }
    });
  }
}

/**
 * 3. Yarn Stock Minimum Alert
 */
export async function checkYarnMinStockAlert(stockItem) {
  const minThreshold = stockItem.minThreshold || 500;
  if (stockItem.current <= minThreshold) {
    return triggerSmartAlert({
      alertId: 'yarn_min_stock',
      title: `📦 LOW YARN INVENTORY: ${stockItem.name}`,
      message: `🧶 *Raw Material:* ${stockItem.name}\n📉 *Current Stock:* ${stockItem.current} ${stockItem.unit}\n⚠️ *Minimum Level:* ${minThreshold} ${stockItem.unit}\n🏭 *Supplier:* ${stockItem.supplier || 'Spinning Mill'}\n\nImmediate purchase order requisition recommended!`,
      metadata: { stockId: stockItem.id, currentStock: stockItem.current }
    });
  }
}

/**
 * 4. Critical Machine Alarm Alert
 */
export async function checkCriticalAlarmAlert(alarm) {
  if (alarm.severity === 'critical') {
    return triggerSmartAlert({
      alertId: 'critical_machine_alarm',
      title: `🚨 CRITICAL HARDWARE ALARM: LOOM ${alarm.loomId || 'FACILITY'}`,
      message: `⚠️ *Alarm Code:* ${alarm.code || 'CRIT-01'}\n📝 *Description:* ${alarm.message}\n⚙️ *Loom Unit:* ${alarm.loomId || 'All'}\n🕒 *Timestamp:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nFloor master intervention required immediately!`,
      metadata: { loomId: alarm.loomId, alarmId: alarm.id }
    });
  }
}
