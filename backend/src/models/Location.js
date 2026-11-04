import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['floor', 'rack', 'godown', 'dispatch', 'jobwork', 'other'],
      default: 'rack',
      index: true
    },
    shed: {
      type: String,
      default: 'Main Shed'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Location = mongoose.model('Location', locationSchema);

