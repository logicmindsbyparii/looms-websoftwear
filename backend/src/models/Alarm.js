import mongoose from 'mongoose';

const alarmSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'warning',
      index: true
    },
    title: {
      type: String,
      required: true
    },
    machine: {
      type: String,
      default: 'FACTORY-WIDE',
      index: true
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    shed: {
      type: String,
      default: 'Main Shed'
    },
    code: {
      type: String,
      default: 'W-001'
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true
    },
    acknowledgedBy: {
      type: String,
      default: null
    },
    acknowledgedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Alarm = mongoose.model('Alarm', alarmSchema);

