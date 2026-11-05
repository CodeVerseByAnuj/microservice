import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import BlacklistedToken from '../models/blacklistedToken.model.js';

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });

export const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user), user });
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};
  // Rejects objects such as { "$gt": "" } that would otherwise act as query operators
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user });
};

export const logout = async (req, res) => {
  await BlacklistedToken.updateOne(
    { token: req.token },
    { $setOnInsert: { token: req.token } },
    { upsert: true },
  );
  res.json({ message: 'Logged out' });
};

export const profile = (req, res) => {
  res.json({ user: req.user });
};
