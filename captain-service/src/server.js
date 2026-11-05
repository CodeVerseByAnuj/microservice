import mongoose from 'mongoose';
import app from './app.js';

const { PORT = 3002, MONGO_URI, JWT_SECRET } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('MONGO_URI and JWT_SECRET are required');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
app.listen(PORT, () => console.log(`captain-service listening on port ${PORT}`));
