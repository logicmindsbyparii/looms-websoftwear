import mongoose from 'mongoose';

const deliveryAuditLogSchema = new mongoose.Schema(
  {
    dispatchId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    performedBy: {
      type: {
        type: String,
        enum: ['ADMIN', 'SUPERVISOR', 'DRIVER', 'PARTY_RECEIVER', 'SYSTEM'],
        required: true
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      name: {
        type: String,
        default: ''
      },
      role: {
        type: String,
        default: ''
      },
      phone: {
        type: String,
        default: ''
      }
    },
    statusFrom: {
      type: String,
      default: ''
    },
    statusTo: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    dispatchedQty: {
      type: Number,
      default: null
    },
    receivedQty: {
      type: Number,
      default: null
    },
    shortage: {
      type: Number,
      default: null
    },
    gps: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: '' }
    },
    ip: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

deliveryAuditLogSchema.index({ dispatchId: 1, timestamp: -1 });
deliveryAuditLogSchema.index({ action: 1, timestamp: -1 });

// Protect audit logs from deletion or tampering by regular application calls
deliveryAuditLogSchema.pre('updateOne', function (next) {
  if (this.getOptions()?.__allowAuditModification) return next();
  next(new Error('ImmutableAuditError: Delivery audit records cannot be modified once written.'));
});

deliveryAuditLogSchema.pre('deleteOne', function (next) {
  if (this.getOptions()?.__allowAuditModification) return next();
  next(new Error('ImmutableAuditError: Delivery audit records cannot be deleted.'));
});

deliveryAuditLogSchema.pre('deleteMany', function (next) {
  if (this.getOptions()?.__allowAuditModification) return next();
  next(new Error('ImmutableAuditError: Delivery audit records cannot be deleted in bulk.'));
});

export const DeliveryAuditLog = mongoose.model('DeliveryAuditLog', deliveryAuditLogSchema);

