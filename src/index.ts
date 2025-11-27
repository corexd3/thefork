import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhooks';
import { requestLogger, responseLogger } from './middleware/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(responseLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Hacienda Alakran Vapi Service',
    timestamp: new Date().toISOString()
  });
});

// Webhook routes
app.use('/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Hacienda Alakran Vapi Webhook Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      assistantRequest: 'POST /webhooks/assistant-request (Vapi Server URL)',
      checkAvailability: 'POST /webhooks/check-availability',
      reservationComplete: 'POST /webhooks/reservation-complete'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Hacienda Alakran Vapi Service');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nAvailable endpoints:');
  console.log(`- GET  http://localhost:${PORT}/`);
  console.log(`- GET  http://localhost:${PORT}/health`);
  console.log(`- POST http://localhost:${PORT}/webhooks/assistant-request (Server URL for Vapi)`);
  console.log(`- POST http://localhost:${PORT}/webhooks/check-availability`);
  console.log(`- POST http://localhost:${PORT}/webhooks/reservation-complete`);
  console.log('========================================\n');
});

export default app;
