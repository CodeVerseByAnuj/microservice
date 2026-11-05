import mongoose from 'mongoose';
import LedgerEntry from '../models/ledgerEntry.model.js';
import Payout from '../models/payout.model.js';

const MAX_PAGE_SIZE = 100;

const isObjectId = (value) => typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
};

const getBalance = async (captainId) => {
  // aggregate does not cast strings, and captainId comes from a JSON response
  const [result] = await LedgerEntry.aggregate([
    { $match: { captainId: new mongoose.Types.ObjectId(captainId) } },
    { $group: { _id: null, balance: { $sum: '$amount' } } },
  ]);
  return result?.balance ?? 0;
};

// Safe to retry: an entry that is already saved is left as it is, and a missing one is added
const recordEntries = (entries) =>
  LedgerEntry.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { idempotencyKey: entry.idempotencyKey },
        update: { $setOnInsert: entry },
        upsert: true,
      },
    })),
    { ordered: false },
  );

export const balance = async (req, res) => {
  res.json({ balance: await getBalance(req.captain._id), currency: 'INR' });
};

export const transactions = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { captainId: req.captain._id };
  const [entries, total] = await Promise.all([
    LedgerEntry.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    LedgerEntry.countDocuments(filter),
  ]);
  res.json({ transactions: entries, page, limit, total });
};

export const requestPayout = async (req, res) => {
  const amount = req.body?.amount;
  if (!isPositiveInteger(amount)) {
    return res.status(400).json({ message: 'Amount must be a positive whole number of paise' });
  }
  if (amount > (await getBalance(req.captain._id))) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  try {
    const payout = await Payout.create({ captainId: req.captain._id, amount });
    res.status(201).json({ payout });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A payout is already pending' });
    }
    throw err;
  }
};

export const payouts = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { captainId: req.captain._id };
  const [items, total] = await Promise.all([
    Payout.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Payout.countDocuments(filter),
  ]);
  res.json({ payouts: items, page, limit, total });
};

export const rideCompleted = async (req, res) => {
  const { captainId, rideId, fare, paymentMethod } = req.body ?? {};
  if (!isObjectId(captainId) || !isObjectId(rideId)) {
    return res.status(400).json({ message: 'captainId and rideId must be valid IDs' });
  }
  if (!isPositiveInteger(fare)) {
    return res.status(400).json({ message: 'Fare must be a positive whole number of paise' });
  }
  if (paymentMethod !== 'online' && paymentMethod !== 'cash') {
    return res.status(400).json({ message: 'paymentMethod must be online or cash' });
  }

  const commission = Math.round((fare * Number(process.env.COMMISSION_PERCENT)) / 100);
  const entries = [];
  // On a cash ride the captain already holds the fare, so only the commission is recorded
  if (paymentMethod === 'online') {
    entries.push({ type: 'earning', amount: fare, idempotencyKey: `ride:${rideId}:earning` });
  }
  if (commission > 0) {
    entries.push({ type: 'commission', amount: -commission, idempotencyKey: `ride:${rideId}:commission` });
  }

  if (entries.length > 0) {
    await recordEntries(entries.map((entry) => ({ ...entry, captainId, rideId })));
  }
  res.status(201).json({ message: 'Ride recorded' });
};

export const updatePayoutStatus = async (req, res) => {
  const { id } = req.params;
  const status = req.body?.status;
  if (!isObjectId(id)) {
    return res.status(404).json({ message: 'Payout not found' });
  }
  if (status !== 'paid' && status !== 'failed') {
    return res.status(400).json({ message: 'Status must be paid or failed' });
  }

  // Allowing the same status again lets a retry finish a write that failed halfway
  const payout = await Payout.findOneAndUpdate(
    { _id: id, status: { $in: ['pending', status] } },
    { status },
    { returnDocument: 'after' },
  );
  if (!payout) {
    const exists = await Payout.exists({ _id: id });
    return exists
      ? res.status(409).json({ message: 'Payout is already settled' })
      : res.status(404).json({ message: 'Payout not found' });
  }

  if (status === 'paid') {
    await recordEntries([
      {
        captainId: payout.captainId,
        type: 'payout',
        amount: -payout.amount,
        payoutId: payout._id,
        idempotencyKey: `payout:${payout._id}`,
      },
    ]);
  }
  res.json({ payout });
};
