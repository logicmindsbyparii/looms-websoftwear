import mongoose from 'mongoose';

const reportScheduleSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      enum: [
        'daily_production',
        'shift_production',
        'loom_status',
        'loom_efficiency',
        'yarn_consumption',
        'fabric_quality',
        'worker_attendance',
        'maintenance',
        'low_stock',
        'order_completion',
        'daily_factory_summary'
      ]
    },
    name: {
      type: String,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    time: {
      type: String,
      default: '08:00' // HH:mm in Asia/Kolkata
    },
    frequency: {
      type: String,
      enum: ['daily', 'shift', 'weekly', 'monthly'],
      default: 'daily'
    },
    targetRoles: {
      type: [String],
      default: ['Admin', 'Owner', 'Supervisor', 'Production Manager']
    },
    lastSentAt: {
      type: Date
    }
  },
  { _id: false }
);

const alertRuleSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      enum: [
        'loom_stop',
        'production_low',
        'yarn_min_stock',
        'maintenance_due',
        'quality_reject_high',
        'order_delayed',
        'critical_machine_alarm',
        'shift_end'
      ]
    },
    name: {
      type: String,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 0
    },
    thresholdUnit: {
      type: String,
      default: ''
    },
    targetRoles: {
      type: [String],
      default: ['Admin', 'Supervisor', 'Maintenance Engineer']
    },
    cooldownMinutes: {
      type: Number,
      default: 30
    },
    lastTriggeredAt: {
      type: Date
    }
  },
  { _id: false }
);

const whatsAppConfigSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true
    },
    apiToken: {
      type: String,
      default: ''
    },
    phoneNumberId: {
      type: String,
      default: ''
    },
    businessAccountId: {
      type: String,
      default: ''
    },
    webhookVerifyToken: {
      type: String,
      default: 'loomus_webhook_verify_token_secure_2026'
    },
    apiVersion: {
      type: String,
      default: 'v21.0'
    },
    isSimulated: {
      type: Boolean,
      default: false
    },
    reportSchedules: {
      type: [reportScheduleSchema],
      default: [
        {
          reportId: 'daily_production',
          name: 'Daily Production Report',
          enabled: true,
          time: '08:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Owner', 'Production Manager']
        },
        {
          reportId: 'shift_production',
          name: 'Shift-wise Production Report',
          enabled: true,
          time: '14:00',
          frequency: 'shift',
          targetRoles: ['Admin', 'Supervisor']
        },
        {
          reportId: 'loom_status',
          name: 'Loom Running/Stopped Report',
          enabled: true,
          time: '10:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Supervisor', 'Maintenance Engineer']
        },
        {
          reportId: 'loom_efficiency',
          name: 'Loom Efficiency Report',
          enabled: true,
          time: '18:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Owner']
        },
        {
          reportId: 'yarn_consumption',
          name: 'Yarn Consumption Report',
          enabled: true,
          time: '19:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Production Manager']
        },
        {
          reportId: 'fabric_quality',
          name: 'Fabric Quality Report',
          enabled: true,
          time: '17:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Supervisor']
        },
        {
          reportId: 'worker_attendance',
          name: 'Worker Attendance Report',
          enabled: true,
          time: '09:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Supervisor']
        },
        {
          reportId: 'maintenance',
          name: 'Maintenance Report',
          enabled: true,
          time: '11:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Maintenance Engineer']
        },
        {
          reportId: 'low_stock',
          name: 'Inventory Low Stock Alerts',
          enabled: true,
          time: '12:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Production Manager']
        },
        {
          reportId: 'order_completion',
          name: 'Order Completion Report',
          enabled: true,
          time: '16:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Owner']
        },
        {
          reportId: 'daily_factory_summary',
          name: 'Daily Factory Summary',
          enabled: true,
          time: '20:00',
          frequency: 'daily',
          targetRoles: ['Admin', 'Owner']
        }
      ]
    },
    alertRules: {
      type: [alertRuleSchema],
      default: [
        {
          alertId: 'loom_stop',
          name: 'Loom Unexpected Stop Alert',
          enabled: true,
          threshold: 0,
          thresholdUnit: 'status',
          targetRoles: ['Admin', 'Supervisor'],
          cooldownMinutes: 15
        },
        {
          alertId: 'production_low',
          name: 'Production Below Target Alert',
          enabled: true,
          threshold: 70, // percent
          thresholdUnit: '%',
          targetRoles: ['Admin', 'Production Manager'],
          cooldownMinutes: 60
        },
        {
          alertId: 'yarn_min_stock',
          name: 'Yarn Stock Minimum Alert',
          enabled: true,
          threshold: 500, // kg
          thresholdUnit: 'kg',
          targetRoles: ['Admin', 'Production Manager'],
          cooldownMinutes: 120
        },
        {
          alertId: 'maintenance_due',
          name: 'Machine Maintenance Due Alert',
          enabled: true,
          threshold: 30, // days
          thresholdUnit: 'days',
          targetRoles: ['Admin', 'Maintenance Engineer'],
          cooldownMinutes: 180
        },
        {
          alertId: 'quality_reject_high',
          name: 'Fabric Quality Rejection High Alert',
          enabled: true,
          threshold: 5, // percent
          thresholdUnit: '%',
          targetRoles: ['Admin', 'Supervisor'],
          cooldownMinutes: 60
        },
        {
          alertId: 'order_delayed',
          name: 'Sales Order Delayed Alert',
          enabled: true,
          threshold: 1, // days overdue
          thresholdUnit: 'days',
          targetRoles: ['Admin', 'Owner'],
          cooldownMinutes: 240
        },
        {
          alertId: 'critical_machine_alarm',
          name: 'Critical Machine Hardware Alarm',
          enabled: true,
          threshold: 0,
          thresholdUnit: 'critical',
          targetRoles: ['Admin', 'Supervisor', 'Maintenance Engineer'],
          cooldownMinutes: 10
        },
        {
          alertId: 'shift_end',
          name: 'Shift Transition Summary Alert',
          enabled: true,
          threshold: 0,
          thresholdUnit: 'event',
          targetRoles: ['Admin', 'Supervisor'],
          cooldownMinutes: 60
        }
      ]
    },
    aiAssistant: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowedLanguages: {
        type: [String],
        default: ['en', 'hi', 'gu']
      },
      enableRealDbQueries: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

export const WhatsAppConfig = mongoose.model('WhatsAppConfig', whatsAppConfigSchema);

