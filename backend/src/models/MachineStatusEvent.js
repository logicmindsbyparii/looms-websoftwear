import mongoose from 'mongoose';

const machineStatusEventSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true
    },
    previousStatus: {
      type: String,
      default: ''
    },
    newStatus: {
      type: String,
      required: true
    },
    changedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, default: 'system' },
      role: { type: String, default: 'System' }
    },
    reason: {
      type: String,
      default: 'Manual user action'
    }
  },
  {
    timestamps: true
  }
);

export const MachineStatusEvent = mongoose.model('MachineStatusEvent', machineStatusEventSchema);

