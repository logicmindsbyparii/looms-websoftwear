import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
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
    current: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    max: {
      type: Number,
      default: 2000
    },
    unit: {
      type: String,
      default: 'kg'
    },
    rate: {
      type: Number,
      default: 250
    },
    minThreshold: {
      type: Number,
      default: 500
    },
    category: {
      type: String,
      default: 'Spun Yarn'
    },
    supplier: {
      type: String,
      default: 'Spinning Mill'
    }
  },
  {
    timestamps: true
  }
);

export const Stock = mongoose.model('Stock', stockSchema);

