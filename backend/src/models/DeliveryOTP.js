import mongoose from 'mongoose';

const deliveryOTPSchema = new mongoose.Schema(
  {
    dispatchId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    partyPhone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Automatic MongoDB TTL deletion when expired
    }
  },
  {
    timestamps: true
  }
);

deliveryOTPSchema.index({ dispatchId: 1, isUsed: 1, expiresAt: 1 });

export const DeliveryOTP = mongoose.model('DeliveryOTP', deliveryOTPSchema);
