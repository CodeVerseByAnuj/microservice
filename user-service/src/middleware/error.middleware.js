export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  // Errors raised by Express itself, such as malformed JSON bodies
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
