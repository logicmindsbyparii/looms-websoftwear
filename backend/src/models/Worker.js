import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
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
    role: {
      type: String,
      default: 'Loom Operator'
    },
    machine: {
      type: String,
      default: 'Unassigned'
    },
    shift: {
      type: String,
      default: 'Morning (6AM - 2PM)'
    },
    phone: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'break', 'off'],
      default: 'active',
      index: true
    },
    shed: {
      type: String,
      default: 'Shed A'
    }
  },
  {
    timestamps: true
  }
);

export const Worker = mongoose.model('Worker', workerSchema);

