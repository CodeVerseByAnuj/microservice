import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    // ID from captain-service, no ref because that data lives in another database
    captainId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      required: true,
      enum: ['earning', 'commission', 'bonus', 'adjustment', 'payout'],
    },
    // In paise: positive means credit, negative means debit
    amount: { type: Number, required: true, validate: Number.isInteger },
    currency: { type: String, default: 'INR' },
    rideId: { type: mongoose.Schema.Types.ObjectId },
    payoutId: { type: mongoose.Schema.Types.ObjectId },
    // Stops the same event being recorded twice, e.g. "ride:<rideId>:earning"
    idempotencyKey: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

ledgerEntrySchema.index({ captainId: 1, createdAt: -1 });

export default mongoose.model('LedgerEntry', ledgerEntrySchema);
