import mongoose from 'mongoose';

const productionLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    machine: {
      type: String,
      required: true,
      index: true
    },
    fabric: {
      type: String,
      required: true
    },
    shift: {
      type: String,
      default: 'Morning'
    },
    output: {
      type: Number,
      required: true,
      min: [0, 'Output cannot be negative']
    },
    target: {
      type: Number,
      default: 75
    },
    quality: {
      type: String,
      default: 'A-Grade (Export)'
    },
    defects: {
      type: Number,
      default: 0
    },
    operator: {
      type: String,
      default: 'Loom Operator'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const ProductionLog = mongoose.model('ProductionLog', productionLogSchema);

