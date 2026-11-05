import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  // Removed after one day, when the token would have expired anyway
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

export default mongoose.model('BlacklistedToken', blacklistedTokenSchema);
