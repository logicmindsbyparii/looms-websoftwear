import mongoose from 'mongoose';

const whatsAppRecipientSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    role: {
      type: String,
      enum: ['Admin', 'Owner', 'Supervisor', 'Production Manager', 'Maintenance Engineer'],
      default: 'Admin',
      index: true
    },
    subscribedReports: {
      type: [String],
      default: [
        'daily_production',
        'shift_production',
        'loom_status',
        'loom_efficiency',
        'daily_factory_summary'
      ]
    },
    subscribedAlerts: {
      type: [String],
      default: [
        'loom_stop',
        'production_low',
        'critical_machine_alarm'
      ]
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const WhatsAppRecipient = mongoose.model('WhatsAppRecipient', whatsAppRecipientSchema);

