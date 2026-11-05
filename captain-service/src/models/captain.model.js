import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const captainSchema = new mongoose.Schema(
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
    status: { type: String, required: true, enum: ['active', 'inactive'], default: 'inactive' },
    vehicle: {
      type: { type: String, required: true, enum: ['car', 'motorcycle', 'auto'] },
      color: { type: String, required: true, trim: true },
      plate: { type: String, required: true, trim: true, uppercase: true },
      capacity: { type: Number, required: true, min: 1 },
    },
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

captainSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

captainSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('Captain', captainSchema);
