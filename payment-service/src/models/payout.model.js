import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    captainId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // In paise
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    currency: { type: String, default: 'INR' },
    status: { type: String, required: true, enum: ['pending', 'paid', 'failed'], default: 'pending' },
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

payoutSchema.index({ captainId: 1, createdAt: -1 });
// Stops two simultaneous requests from paying out the same balance
payoutSchema.index(
  { captainId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

export default mongoose.model('Payout', payoutSchema);
