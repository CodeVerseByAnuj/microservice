import mongoose from 'mongoose';
import { compareInWorker, hashInWorker } from '../workers/password.pool.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    // bcrypt only uses the first 72 bytes of a password
    password: { type: String, required: true, minlength: 8, maxlength: 72, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await hashInWorker(this.password);
  }
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return compareInWorker(password, this.password);
};

export default mongoose.model('User', userSchema);
