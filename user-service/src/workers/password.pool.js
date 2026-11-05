import { Piscina } from 'piscina';

// bcryptjs runs on the JS thread, so hashing here would block every other request
const pool = new Piscina({
  filename: new URL('./password.worker.js', import.meta.url).href,
});

export const hashInWorker = (password) => pool.run(password, { name: 'hash' });

export const compareInWorker = (password, hashed) =>
  pool.run({ password, hashed }, { name: 'compare' });
