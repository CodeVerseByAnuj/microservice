import jwt from 'jsonwebtoken';
import Captain from '../models/captain.model.js';
import BlacklistedToken from '../models/blacklistedToken.model.js';

const signToken = (captain) =>
  jwt.sign({ id: captain._id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });

export const register = async (req, res) => {
  const { name, email, password, vehicle } = req.body ?? {};
  const captain = await Captain.create({ name, email, password, vehicle });
  res.status(201).json({ token: signToken(captain), captain });
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};
  // Rejects objects such as { "$gt": "" } that would otherwise act as query operators
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const captain = await Captain.findOne({ email: email.toLowerCase() }).select('+password');
  if (!captain || !(await captain.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ token: signToken(captain), captain });
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
  res.json({ captain: req.captain });
};

export const updateStatus = async (req, res) => {
  req.captain.status = req.body?.status;
  await req.captain.save();
  res.json({ captain: req.captain });
};
