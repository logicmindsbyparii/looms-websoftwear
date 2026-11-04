import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

refreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > Date.now();
};

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

