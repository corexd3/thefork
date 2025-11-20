import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log incoming webhook requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log('\n========================================');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n');
  next();
};

/**
 * Middleware to log responses
 */
export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data): Response {
    console.log('\n========================================');
    console.log(`Response for ${req.method} ${req.path}:`);
    console.log('Status:', res.statusCode);
    console.log('Data:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('========================================\n');
    return originalSend.call(this, data);
  };

  next();
};
