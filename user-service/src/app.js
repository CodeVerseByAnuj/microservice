import express from 'express';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'user-service', status: 'ok' }));
app.use('/', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
