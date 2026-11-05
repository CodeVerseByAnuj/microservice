import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import BlacklistedToken from '../models/blacklistedToken.model.js';

export const requireAuth = async (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (await BlacklistedToken.exists({ token })) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await User.findById(payload.id);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = user;
  req.token = token;
  next();
};
