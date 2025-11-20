import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};

/**
 * Optional: Middleware to verify webhook secret
 */
export const verifyWebhookSecret = (req: Request, res: Response, next: NextFunction) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    // If no secret is configured, skip verification
    return next();
  }

  const receivedSecret = req.headers['x-webhook-secret'] || req.headers['authorization']?.replace('Bearer ', '');

  if (receivedSecret !== webhookSecret) {
    console.error('Invalid webhook secret');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
};
