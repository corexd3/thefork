import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(__dirname, '../../vapi-requests.log');

/**
 * Append log entry to file
 */
function appendToLogFile(entry: string) {
  try {
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    // Silently fail if can't write to file
  }
}

/**
 * Middleware to log incoming webhook requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();

  const logEntry = [
    '\n========================================',
    `[${timestamp}] ${req.method} ${req.path}`,
    'Headers: ' + JSON.stringify(req.headers, null, 2),
    'Body: ' + JSON.stringify(req.body, null, 2),
    '========================================'
  ].join('\n');

  console.log(logEntry);
  appendToLogFile(logEntry);

  next();
};

/**
 * Middleware to log responses
 */
export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function(data): Response {
    const timestamp = new Date().toISOString();
    const logEntry = [
      '\n========================================',
      `[${timestamp}] Response for ${req.method} ${req.path}:`,
      'Status: ' + res.statusCode,
      'Data: ' + (typeof data === 'string' ? data : JSON.stringify(data, null, 2)),
      '========================================'
    ].join('\n');

    console.log(logEntry);
    appendToLogFile(logEntry);

    return originalSend.call(this, data);
  };

  next();
};
