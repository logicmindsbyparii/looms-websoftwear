import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    stockId: {
      type: String,
      required: true,
      index: true
    },
    materialName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment'],
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    supplierOrDepartment: {
      type: String,
      default: ''
    },
    recordedBy: {
      type: String,
      default: 'system'
    }
  },
  {
    timestamps: true
  }
);

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

