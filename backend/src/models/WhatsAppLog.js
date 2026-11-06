import mongoose from 'mongoose';

const whatsAppLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['outbound', 'inbound'],
      default: 'outbound',
      index: true
    },
    recipientPhone: {
      type: String,
      required: true,
      index: true
    },
    recipientName: {
      type: String,
      default: ''
    },
    messageType: {
      type: String,
      enum: ['report', 'alert', 'ai_assistant', 'manual', 'test', 'status_update'],
      default: 'report',
      index: true
    },
    title: {
      type: String,
      default: 'LOOMUS Notification'
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
      index: true
    },
    error: {
      type: String,
      default: ''
    },
    metaMessageId: {
      type: String,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    retryCount: {
      type: Number,
      default: 0
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast history querying and deduplication
whatsAppLogSchema.index({ sentAt: -1 });
whatsAppLogSchema.index({ messageType: 1, sentAt: -1 });
whatsAppLogSchema.index({ recipientPhone: 1, sentAt: -1 });

export const WhatsAppLog = mongoose.model('WhatsAppLog', whatsAppLogSchema);
