import mongoose from 'mongoose';
import app from './app.js';

const { PORT = 3003, MONGO_URI, CAPTAIN_SERVICE_URL, INTERNAL_API_KEY, COMMISSION_PERCENT } = process.env;

if (!MONGO_URI || !CAPTAIN_SERVICE_URL || !INTERNAL_API_KEY) {
  console.error('MONGO_URI, CAPTAIN_SERVICE_URL and INTERNAL_API_KEY are required');
  process.exit(1);
}

const commissionPercent = Number(COMMISSION_PERCENT);
if (!COMMISSION_PERCENT || !(commissionPercent >= 0 && commissionPercent <= 100)) {
  console.error('COMMISSION_PERCENT must be a number from 0 to 100');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
app.listen(PORT, () => console.log(`payment-service listening on port ${PORT}`));
