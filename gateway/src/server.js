import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json' with { type: 'json' };

const { PORT = 3000, WORKERS = availableParallelism(), USER_SERVICE_URL, CAPTAIN_SERVICE_URL, PAYMENT_SERVICE_URL } = process.env;

if (!USER_SERVICE_URL || !CAPTAIN_SERVICE_URL || !PAYMENT_SERVICE_URL) {
  console.error('USER_SERVICE_URL, CAPTAIN_SERVICE_URL and PAYMENT_SERVICE_URL are required');
  process.exit(1);
}

const app = express();

app.get('/health', (req, res) => res.json({ service: 'gateway', status: 'ok' }));

app.get('/openapi.json', (req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// The mount path is stripped before proxying: /users/login -> user-service /login
app.use('/users', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/captains', createProxyMiddleware({ target: CAPTAIN_SERVICE_URL, changeOrigin: true }));
// Internal routes are for other services only, and payment-service also checks an API key
app.use('/payments/internal', (req, res) => res.status(404).json({ message: 'Route not found' }));
app.use('/payments', createProxyMiddleware({ target: PAYMENT_SERVICE_URL, changeOrigin: true }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

if (cluster.isPrimary) {
  for (let i = 0; i < Number(WORKERS); i++) cluster.fork();

  // Restart after a delay so a worker that keeps crashing does not spin the CPU
  cluster.on('exit', (worker) => {
    console.error(`gateway worker ${worker.process.pid} died, restarting`);
    setTimeout(() => cluster.fork(), 1000);
  });
} else {
  app.listen(PORT, () => console.log(`gateway worker ${process.pid} listening on port ${PORT}`));
}
