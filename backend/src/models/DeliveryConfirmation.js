import mongoose from 'mongoose';

const deliveryConfirmationSchema = new mongoose.Schema(
  {
    confirmationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    dispatchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    salesOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    partyName: {
      type: String,
      required: true,
      trim: true
    },
    partyPhone: {
      type: String,
      required: true,
      trim: true
    },
    fabric: {
      type: String,
      required: true,
      trim: true
    },
    dispatchedMetres: {
      type: Number,
      required: true,
      min: 0.1
    },
    receivedMetres: {
      type: Number,
      required: true,
      min: 0
    },
    dispatchedRolls: {
      type: Number,
      required: true,
      min: 1
    },
    receivedRolls: {
      type: Number,
      required: true,
      min: 0
    },
    shortageMetres: {
      type: Number,
      default: 0
    },
    damagedRolls: [
      {
        rollId: String,
        metres: Number,
        damageType: String,
        description: String
      }
    ],
    status: {
      type: String,
      enum: ['Delivered', 'Partially Delivered', 'Delivery Disputed'],
      required: true,
      index: true
    },
    receiverName: {
      type: String,
      required: true,
      trim: true
    },
    receiverPhone: {
      type: String,
      required: true,
      trim: true
    },
    remarks: {
      type: String,
      default: ''
    },
    photos: {
      type: [String],
      default: []
    },
    verifiedVia: {
      type: String,
      default: 'RECEIVER_OTP'
    },
    ip: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    confirmedAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

deliveryConfirmationSchema.index({ createdAt: -1 });

export const DeliveryConfirmation = mongoose.model('DeliveryConfirmation', deliveryConfirmationSchema);
