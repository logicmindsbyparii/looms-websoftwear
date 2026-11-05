import mongoose from 'mongoose';

export const VALID_DELIVERY_STATUSES = [
  'Draft',
  'Dispatched',
  'Picked Up',
  'In Transit',
  'Awaiting Receiver Confirmation',
  'Delivered',
  'Partially Delivered',
  'Delivery Disputed',
  'Delivery Failed',
  'Cancelled'
];

export const ALLOWED_STATUS_TRANSITIONS = {
  'Draft': ['Dispatched', 'Cancelled'],
  'Dispatched': ['Picked Up', 'Cancelled'],
  'Picked Up': ['In Transit', 'Cancelled', 'Delivery Failed'],
  'In Transit': ['Awaiting Receiver Confirmation', 'Delivery Failed', 'Cancelled'],
  'Awaiting Receiver Confirmation': [
    'Delivered',
    'Partially Delivered',
    'Delivery Disputed',
    'Delivery Failed'
  ],
  'Delivered': [], // Final terminal state - cannot transition once confirmed
  'Partially Delivered': ['Delivered'], // Only if reconciled by Admin
  'Delivery Disputed': ['Delivered', 'Partially Delivered', 'Delivery Failed', 'Cancelled'], // Resolved by Admin
  'Delivery Failed': ['In Transit', 'Dispatched', 'Cancelled'],
  'Cancelled': []
};

const dispatchRollItemSchema = new mongoose.Schema(
  {
    rollId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    qrToken: {
      type: String,
      trim: true,
      default: ''
    },
    metres: {
      type: Number,
      required: true,
      min: 0.1,
      set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
    },
    quality: {
      type: String,
      default: 'A-Grade (Export)',
      trim: true
    }
  },
  { _id: false }
);

const damagedRollItemSchema = new mongoose.Schema(
  {
    rollId: {
      type: String,
      trim: true
    },
    metres: {
      type: Number,
      default: 0
    },
    damageType: {
      type: String,
      default: 'Stain / Tear / Water Damage'
    },
    description: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const dispatchSchema = new mongoose.Schema(
  {
    dispatchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    salesOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    partyPhone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    partyAddress: {
      type: String,
      trim: true,
      default: ''
    },
    fabric: {
      type: String,
      required: true,
      trim: true
    },
    rolls: {
      type: [dispatchRollItemSchema],
      default: []
    },
    totalMetresDispatched: {
      type: Number,
      required: true,
      min: 0.1,
      set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
    },
    totalRollsDispatched: {
      type: Number,
      required: true,
      min: 1
    },
    driver: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      vehicleNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true
      },
      licenseNumber: {
        type: String,
        trim: true,
        default: ''
      },
      driverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    },
    status: {
      type: String,
      enum: VALID_DELIVERY_STATUSES,
      default: 'Dispatched',
      index: true
    },
    dispatchedAt: {
      type: Date,
      default: Date.now
    },
    dispatchedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      username: {
        type: String,
        default: 'admin'
      },
      role: {
        type: String,
        default: 'Admin'
      }
    },
    collectionTime: {
      type: Date,
      default: null
    },
    transitStartedAt: {
      type: Date,
      default: null
    },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: '' },
      updatedAt: { type: Date, default: null }
    },
    locationHistory: [
      {
        latitude: Number,
        longitude: Number,
        address: String,
        recordedAt: { type: Date, default: Date.now }
      }
    ],
    confirmationToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    confirmationTokenExpiresAt: {
      type: Date,
      required: true,
      index: true
    },
    confirmationTokenUsed: {
      type: Boolean,
      default: false,
      index: true
    },
    receivedSummary: {
      actualMetresReceived: {
        type: Number,
        default: null,
        set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
      },
      actualRollsReceived: {
        type: Number,
        default: null
      },
      shortageMetres: {
        type: Number,
        default: 0,
        set: (v) => (v != null ? Math.round(Number(v) * 100) / 100 : v)
      },
      damagedRolls: {
        type: [damagedRollItemSchema],
        default: []
      },
      remarks: {
        type: String,
        default: ''
      },
      receiverName: {
        type: String,
        default: ''
      },
      receiverPhone: {
        type: String,
        default: ''
      },
      photos: {
        type: [String],
        default: []
      },
      confirmedAt: {
        type: Date,
        default: null
      }
    },
    disputeDetails: {
      isDisputed: {
        type: Boolean,
        default: false,
        index: true
      },
      disputedAt: {
        type: Date,
        default: null
      },
      reason: {
        type: String,
        default: ''
      },
      resolved: {
        type: Boolean,
        default: false
      },
      resolvedBy: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        username: String,
        role: String
      },
      resolvedAt: {
        type: Date,
        default: null
      },
      resolutionAction: {
        type: String,
        default: ''
      },
      resolutionNote: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

dispatchSchema.index({ createdAt: -1 });
dispatchSchema.index({ partyName: 1, status: 1 });
dispatchSchema.index({ 'driver.vehicleNumber': 1, status: 1 });

dispatchSchema.statics.isValidTransition = function (currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

export const Dispatch = mongoose.model('Dispatch', dispatchSchema);

