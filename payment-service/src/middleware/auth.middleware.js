import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (value) => createHash('sha256').update(value).digest();

// captain-service owns the JWT secret and the logout blacklist, so it verifies the token
export const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let response;
  try {
    response = await fetch(`${process.env.CAPTAIN_SERVICE_URL}/profile`, {
      headers: { authorization },
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error(err);
    return res.status(503).json({ message: 'Captain service unavailable' });
  }

  if (response.status === 401) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!response.ok) {
    console.error(`captain-service /profile returned ${response.status}`);
    return res.status(503).json({ message: 'Captain service unavailable' });
  }

  const { captain } = await response.json();
  req.captain = captain;
  next();
};

export const requireInternalKey = (req, res, next) => {
  // Hashing gives both values the same length, which timingSafeEqual requires
  const key = sha256(req.headers['x-internal-api-key'] ?? '');
  if (!timingSafeEqual(key, sha256(process.env.INTERNAL_API_KEY))) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
