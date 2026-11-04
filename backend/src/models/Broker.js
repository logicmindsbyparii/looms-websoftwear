import mongoose from 'mongoose';

const brokerSchema = new mongoose.Schema(
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
    contactPerson: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: 'Surat'
    },
    type: {
      type: String,
      default: 'Broker'
    },
    comm: {
      type: Number,
      default: 2.0
    },
    totalDeals: {
      type: Number,
      default: 0
    },
    activeOrders: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 5.0
    }
  },
  {
    timestamps: true
  }
);

export const Broker = mongoose.model('Broker', brokerSchema);

