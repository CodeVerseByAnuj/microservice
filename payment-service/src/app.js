import express from 'express';
import paymentRoutes from './routes/payment.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'payment-service', status: 'ok' }));
app.use('/', paymentRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
