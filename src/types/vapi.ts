import { z } from 'zod';

/**
 * Parameters schema for availability check
 */
const AvailabilityParamsSchema = z.object({
  hora: z.string().describe('la hora de la reserva. por ejemplo "la una de la tarde" son las "13:00"'),
  fecha: z.string().describe('La fecha donde el usuario quiere hacer la reserva. Por ejemplo el 3 de septiembre de 2025 se enviará como "2025-09-03"'),
  personas: z.number().describe('numero de personas que atenderan a la reserva')
});

/**
 * Schema for the OLD Vapi format: "function-call" with functionCall object
 */
const FunctionCallSchema = z.object({
  message: z.object({
    type: z.literal('function-call'),
    functionCall: z.object({
      id: z.string().optional(),
      name: z.literal('checkAvailabilityALAKRAN'),
      parameters: AvailabilityParamsSchema
    }).passthrough()
  }).passthrough()
}).passthrough();

/**
 * Schema for the NEW Vapi format: "tool-calls" with toolCalls array
 * Note: arguments can be either a JSON string OR an already-parsed object
 */
const ToolCallsSchema = z.object({
  message: z.object({
    type: z.literal('tool-calls'),
    toolCalls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.union([z.string(), z.record(z.any())]) // Can be string OR object
      })
    })).min(1)
  }).passthrough()
}).passthrough();

/**
 * Combined schema that accepts EITHER format
 * Using .passthrough() to allow extra fields that Vapi sends
 */
export const CheckAvailabilitySchema = z.union([FunctionCallSchema, ToolCallsSchema])

/**
 * Schema for reservation completion data from Vapi
 * Note: structuredData is nested inside message.analysis.structuredData
 * Using .passthrough() to allow extra fields that Vapi sends
 */
export const ReservationCompletionSchema = z.object({
  message: z.object({
    type: z.literal('end-of-call-report'),
    analysis: z.object({
      structuredData: z.object({
        reservation: z.object({
          date: z.string(),
          time: z.string(),
          people: z.number(),
          full_name: z.string(),
          honorific: z.string().optional(),
          baby: z.boolean().optional(),
          allergies: z.string().optional(),
          special_requests: z.string().optional()
        }).passthrough()
      }).passthrough()
    }).passthrough() // Allow extra fields like 'summary', 'successEvaluation'
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
