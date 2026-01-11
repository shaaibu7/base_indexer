import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env';
import apiRoutes from './controllers/api';
import aiRouter from './routes/airoute';
import listenForTransferEvents from './controllers/indexer';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(env.API_PORT, 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);
app.use('/indexer', aiRouter);

app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'ERC-20 Transfer Indexer API', version: '1.0.0' });
});

// Start Indexer
listenForTransferEvents().catch((err) => {
  logger.error('Indexer failed to start', err);
});

// 404 & Error Handling
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down API server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
