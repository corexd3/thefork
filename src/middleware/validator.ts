import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(__dirname, '../../vapi-requests.log');

function appendToLogFile(entry: string) {
  try {
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    // Silently fail
  }
}

/**
 * Extract toolCallId from various Vapi message formats
 */
function extractToolCallId(body: any): string {
  try {
    const message = body?.message;
    if (message?.type === 'tool-calls' && message?.toolCalls?.[0]?.id) {
      return message.toolCalls[0].id;
    }
    if (message?.functionCall?.id) {
      return message.functionCall.id;
    }
  } catch {}
  return 'unknown';
}

/**
 * Middleware factory to validate request body against a Zod schema
 * Returns Vapi-compatible error responses for webhook endpoints
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log raw Vapi payload for debugging
    if (req.body?.message) {
      console.log('\n=== RAW VAPI PAYLOAD ===');
      console.log('message.type:', req.body.message.type);

      if (req.body.message.toolCalls) {
        console.log('toolCalls[0]:', JSON.stringify(req.body.message.toolCalls[0], null, 2));
      }
      if (req.body.message.functionCall) {
        console.log('functionCall:', JSON.stringify(req.body.message.functionCall, null, 2));
      }
      if (req.body.message.analysis) {
        console.log('analysis.structuredData:', JSON.stringify(req.body.message.analysis.structuredData, null, 2));
      }
      if (req.body.message.structuredData) {
        console.log('structuredData (root level):', JSON.stringify(req.body.message.structuredData, null, 2));
      }
      console.log('========================\n');
    }

    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation error:', error.errors);
        // Also log to file for debugging
        const errorLog = `\n=== VALIDATION ERROR ===\n${JSON.stringify(error.errors, null, 2)}\n========================\n`;
        appendToLogFile(errorLog);

        // Check if this is a Vapi webhook request (has message.type)
        const isVapiRequest = req.body?.message?.type;

        if (isVapiRequest) {
          // Return Vapi-compatible response with 200 status
          const toolCallId = extractToolCallId(req.body);
          return res.status(200).json({
            results: [{
              toolCallId: toolCallId,
              result: 'Lo siento, hubo un problema técnico. Por favor, intente nuevamente.'
            }]
          });
        }

        // Non-Vapi requests get standard error response
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
