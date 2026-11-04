import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'Operator'],
      default: 'Operator',
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    lastLoginIp: {
      type: String,
      default: ''
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'gu', 'hi', 'mr'],
      default: 'en'
    },
    twoFactor: {
      enabled: {
        type: Boolean,
        default: false
      },
      secretEnc: {
        type: String,
        default: ''
      },
      recoveryCodesHash: [
        {
          type: String
        }
      ]
    },
    assignedMachines: [
      {
        type: String,
        trim: true
      }
    ],
    tokenVersion: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Virtual for avatar letter
userSchema.virtual('avatar').get(function () {
  return this.displayName ? this.displayName[0].toUpperCase() : 'U';
});

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.incLoginAttempts = async function () {
  // If lock expired, reset attempts to 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    return this.save();
  }

  this.failedLoginAttempts += 1;
  // Lock for 15 minutes after 5 consecutive failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    if (ret.twoFactor) {
      delete ret.twoFactor.secretEnc;
      delete ret.twoFactor.recoveryCodesHash;
    }
    return ret;
  }
});

export const User = mongoose.model('User', userSchema);

