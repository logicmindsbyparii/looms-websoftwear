import mongoose from 'mongoose';

const readyGoodsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    fabric: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true,
      default: 0
    },
    rollCount: {
      type: Number,
      default: 1
    },
    quality: {
      type: String,
      default: 'A-Grade (Export)'
    },
    rate: {
      type: Number,
      default: 45
    },
    location: {
      type: String,
      default: 'Rack A-01'
    },
    status: {
      type: String,
      enum: ['Ready', 'Reserved', 'Dispatched'],
      default: 'Ready',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const ReadyGoods = mongoose.model('ReadyGoods', readyGoodsSchema);

