import { Router } from 'express';
import { register, login, logout, profile, updateStatus } from '../controllers/captain.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, profile);
router.patch('/status', requireAuth, updateStatus);

export default router;
