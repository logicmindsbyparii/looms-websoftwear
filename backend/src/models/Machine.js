import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    shed: {
      type: String,
      default: 'Main Shed',
      index: true
    },
    model: {
      type: String,
      default: 'Airjet Weaving Loom'
    },
    status: {
      type: String,
      enum: ['running', 'stopped', 'idle', 'maintenance'],
      default: 'idle',
      index: true
    },
    rpm: {
      type: Number,
      default: 0
    },
    targetRpm: {
      type: Number,
      default: 850
    },
    fabric: {
      type: String,
      default: '70*72 Plain Cambric'
    },
    output: {
      type: Number,
      default: 0
    },
    targetOutput: {
      type: Number,
      default: 75
    },
    efficiency: {
      type: Number,
      default: 0
    },
    temp: {
      type: Number,
      default: 28
    },
    tension: {
      type: Number,
      default: 0
    },
    pressure: {
      type: Number,
      default: 0
    },
    picksPerMin: {
      type: Number,
      default: 0
    },
    weftStops: {
      type: Number,
      default: 0
    },
    warpStops: {
      type: Number,
      default: 0
    },
    operator: {
      type: String,
      default: 'Unassigned'
    },
    lastMaintenance: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    }
  },
  {
    timestamps: true
  }
);

export const Machine = mongoose.model('Machine', machineSchema);

