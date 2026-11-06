import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    plantName: {
      type: String,
      default: 'LOOMUS Advanced Weaving Facility'
    },
    adminWhatsAppPhone: {
      type: String,
      default: '+91 96646 83069'
    },
    godownWhatsAppPhone: {
      type: String,
      default: '+91 96646 83069'
    },
    salesWhatsAppPhone: {
      type: String,
      default: '+91 96646 83069'
    },
    idleTimeoutMinutes: {
      type: Number,
      default: 30
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'gu', 'hi', 'mr'],
      default: 'en'
    },
    publicScanBaseUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);

