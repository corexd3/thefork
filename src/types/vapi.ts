import { z } from 'zod';

/**
 * Schema for availability check parameters from Vapi
 * Using .passthrough() to allow extra fields that Vapi sends
 */
export const CheckAvailabilitySchema = z.object({
  message: z.object({
    type: z.literal('function-call'),
    functionCall: z.object({
      name: z.literal('checkAvailabilityALAKRAN'),
      parameters: z.object({
        hora: z.string().describe('la hora de la reserva. por ejemplo "la una de la tarde" son las "13:00"'),
        fecha: z.string().describe('La fecha donde el usuario quiere hacer la reserva. Por ejemplo el 3 de septiembre de 2025 se enviará como "2025-09-03"'),
        personas: z.number().describe('numero de personas que atenderan a la reserva')
      })
    }).passthrough() // Allow extra fields like 'id'
  }).passthrough() // Allow extra fields like 'call', 'timestamp', etc.
}).passthrough(); // Allow extra root-level fields

/**
 * Schema for reservation completion data from Vapi
 * Using .passthrough() to allow extra fields that Vapi sends
 */
export const ReservationCompletionSchema = z.object({
  message: z.object({
    type: z.literal('end-of-call-report'),
    structuredData: z.object({
      reservation: z.object({
        date: z.string(),
        time: z.string(),
        people: z.number(),
        full_name: z.string(),
        honorific: z.string(),
        baby: z.boolean(),
        allergies: z.string(),
        special_requests: z.string()
      })
    }).passthrough() // Allow extra fields in structuredData
  }).passthrough() // Allow extra fields like 'call', 'timestamp', etc.
}).passthrough(); // Allow extra root-level fields

/**
 * Type definitions extracted from schemas
 */
export type CheckAvailabilityRequest = z.infer<typeof CheckAvailabilitySchema>;
export type ReservationCompletionRequest = z.infer<typeof ReservationCompletionSchema>;

export interface CheckAvailabilityParams {
  hora: string;
  fecha: string;
  personas: number;
}

export interface ReservationData {
  date: string;
  time: string;
  people: number;
  full_name: string;
  honorific: string;
  baby: boolean;
  allergies: string;
  special_requests: string;
}

/**
 * Vapi webhook response format for function calls
 */
export interface VapiToolResponse {
  results: Array<{
    toolCallId: string;
    result: string;
  }>;
}

/**
 * Generic Vapi webhook response
 */
export interface VapiWebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
}
