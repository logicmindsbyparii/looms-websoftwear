import mongoose from 'mongoose';

const rollMovementSchema = new mongoose.Schema(
  {
    rollId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['created', 'transfer', 'status_change', 'metres_correction', 'qr_reissued', 'void'],
      required: true,
      index: true
    },
    fromLocationId: {
      type: String,
      default: null,
      trim: true
    },
    toLocationId: {
      type: String,
      default: null,
      trim: true
    },
    fromStatus: {
      type: String,
      default: null
    },
    toStatus: {
      type: String,
      default: null
    },
    metresBefore: {
      type: Number,
      default: null
    },
    metresAfter: {
      type: Number,
      default: null
    },
    note: {
      type: String,
      default: '',
      trim: true
    },
    byUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    byName: {
      type: String,
      default: 'System',
      trim: true
    },
    at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Append-only ledger enforcement: reject all update and delete queries
const rejectModification = function (next) {
  const err = new Error('RollMovement is an append-only ledger. Updates and deletions are prohibited.');
  err.statusCode = 400;
  err.errorCode = 'LEDGER_IMMUTABLE';
  return next(err);
};

rollMovementSchema.pre('updateOne', rejectModification);
rollMovementSchema.pre('updateMany', rejectModification);
rollMovementSchema.pre('findOneAndUpdate', rejectModification);
rollMovementSchema.pre('replaceOne', rejectModification);
rollMovementSchema.pre('deleteOne', rejectModification);
rollMovementSchema.pre('deleteMany', function (next) {
  // Allow test database cleanups only when explicitly flagged, otherwise reject
  const filter = this.getFilter ? this.getFilter() : this._conditions;
  if (filter && filter.__forceLedgerPurge === true) {
    delete filter.__forceLedgerPurge;
    return next();
  }
  return rejectModification(next);
});
rollMovementSchema.pre('findOneAndDelete', rejectModification);

export const RollMovement = mongoose.model('RollMovement', rollMovementSchema);
