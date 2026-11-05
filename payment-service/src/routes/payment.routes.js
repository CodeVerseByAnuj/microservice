import { Router } from 'express';
import {
  balance,
  transactions,
  requestPayout,
  payouts,
  rideCompleted,
  updatePayoutStatus,
} from '../controllers/payment.controller.js';
import { requireAuth, requireInternalKey } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/balance', requireAuth, balance);
router.get('/transactions', requireAuth, transactions);
router.post('/payouts', requireAuth, requestPayout);
router.get('/payouts', requireAuth, payouts);

router.post('/internal/ride-completed', requireInternalKey, rideCompleted);
router.patch('/internal/payouts/:id', requireInternalKey, updatePayoutStatus);

export default router;
