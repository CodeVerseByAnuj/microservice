import express from 'express';
import captainRoutes from './routes/captain.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'captain-service', status: 'ok' }));
app.use('/', captainRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
