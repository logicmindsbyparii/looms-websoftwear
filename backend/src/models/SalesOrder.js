import mongoose from 'mongoose';

export const VALID_ORDER_STATUSES = ['Pending', 'In Production', 'Dispatched', 'Delivered', 'Cancelled'];

const salesOrderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    broker: {
      type: String,
      default: 'Direct Mill Sale'
    },
    buyer: {
      type: String,
      required: true,
      trim: true
    },
    fabric: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 meter']
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative']
    },
    total: {
      type: Number,
      required: true
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    deliveryDate: {
      type: String,
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    status: {
      type: String,
      enum: VALID_ORDER_STATUSES,
      default: 'Pending',
      index: true
    },
    advance: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

salesOrderSchema.statics.isValidTransition = function (currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;
  if (currentStatus === 'Delivered') return false; // Final terminal state
  if (newStatus === 'Cancelled') return currentStatus !== 'Delivered' && currentStatus !== 'Dispatched';

  const transitions = {
    'Pending': ['In Production', 'Cancelled'],
    'In Production': ['Dispatched', 'Cancelled'],
    'Dispatched': ['Delivered'],
    'Delivered': []
  };

  return (transitions[currentStatus] || []).includes(newStatus);
};

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);

