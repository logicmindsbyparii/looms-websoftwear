import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sn: {
      type: String,
      default: 'EV-2026-CAM'
    },
    user: {
      type: String,
      default: 'admin'
    },
    location: {
      type: String,
      default: 'Weaving Shed'
    },
    connected: {
      type: Boolean,
      default: true
    },
    ip: {
      type: String,
      default: '192.168.1.100'
    },
    fps: {
      type: Number,
      default: 30
    },
    channel: {
      type: String,
      default: 'CH-01'
    }
  },
  {
    timestamps: true
  }
);

export const Camera = mongoose.model('Camera', cameraSchema);

