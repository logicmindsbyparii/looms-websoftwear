import mongoose from 'mongoose';

const rollSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    fabric: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    quality: {
      type: String,
      default: 'A-Grade (Export)',
      trim: true
    },
    metres: {
      type: Number,
      required: true,
      min: 0.1,
      set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
    },
    originalMetres: {
      type: Number,
      required: true,
      min: 0.1,
      set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
    },
    machineId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    machineName: {
      type: String,
      required: true,
      trim: true
    },
    machineShed: {
      type: String,
      default: ''
    },
    machineModel: {
      type: String,
      default: ''
    },
    locationId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Ready', 'Reserved', 'Dispatched', 'Hold', 'Rejected', 'Void'],
      default: 'Ready',
      index: true
    },
    shift: {
      type: String,
      default: 'Morning'
    },
    operator: {
      type: String,
      default: ''
    },
    productionLogId: {
      type: String,
      default: null,
      trim: true
    },
    lotId: {
      type: String,
      default: null,
      trim: true
    },
    orderId: {
      type: String,
      default: null,
      trim: true
    },
    producedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastScannedAt: {
      type: Date,
      default: null
    },
    lastScannedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, default: '' },
      role: { type: String, default: '' }
    },
    scanCount: {
      type: Number,
      default: 0
    },
    qrVersion: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
rollSchema.index({ status: 1, locationId: 1 });
rollSchema.index({ machineId: 1, createdAt: -1 });
rollSchema.index({ fabric: 1, status: 1 });

export const Roll = mongoose.model('Roll', rollSchema);

