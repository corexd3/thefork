import { Request, Response } from 'express';
import { CheckAvailabilityParams, VapiToolResponse } from '../types/vapi';
import { theForkScraper } from '../services/theForkScraper';

/**
 * Extract parameters and toolCallId from Vapi webhook request
 * Handles both OLD format (function-call) and NEW format (tool-calls)
 */
function extractVapiParams(message: any): { params: CheckAvailabilityParams; toolCallId: string } {
  // NEW format: tool-calls with toolCalls array
  if (message.type === 'tool-calls' && message.toolCalls && message.toolCalls.length > 0) {
    const toolCall = message.toolCalls[0];
    const toolCallId = toolCall.id;

    // Arguments can be either a JSON string OR an already-parsed object
    let params: CheckAvailabilityParams;
    if (typeof toolCall.function.arguments === 'string') {
      params = JSON.parse(toolCall.function.arguments) as CheckAvailabilityParams;
    } else {
      params = toolCall.function.arguments as CheckAvailabilityParams;
    }

    console.log('[Vapi] Detected NEW format: tool-calls');
    return { params, toolCallId };
  }

  // OLD format: function-call with functionCall object
  if (message.type === 'function-call' && message.functionCall) {
    const toolCallId = message.functionCall.id || 'unknown';
    const params = message.functionCall.parameters as CheckAvailabilityParams;

    console.log('[Vapi] Detected OLD format: function-call');
    return { params, toolCallId };
  }

  throw new Error(`Unknown Vapi message format: ${message.type}`);
}

/**
 * Controller for checking restaurant availability
 * This is called during the conversation when Vapi executes the checkAvailabilityALAKRAN function
 */
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    console.log('=== Check Availability Request ===');

    // Extract parameters from Vapi webhook (handles both formats)
    const { message } = req.body;
    const { params, toolCallId } = extractVapiParams(message);

    console.log('Received parameters:');
    console.log('- Fecha (Date):', params.fecha);
    console.log('- Hora (Time):', params.hora);
    console.log('- Personas (People):', params.personas);

    // FIX: If Vapi sends wrong year (2023/2024), auto-correct to 2025
    let correctedDate = params.fecha;
    if (params.fecha.startsWith('2023') || params.fecha.startsWith('2024')) {
      correctedDate = params.fecha.replace(/^202[34]/, '2025');
      console.log('⚠️  Auto-corrected year from', params.fecha, 'to', correctedDate);
    }

    // Validate the received data format
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(correctedDate);
    const isValidTime = /^\d{2}:\d{2}$/.test(params.hora);
    const isValidPeople = params.personas > 0 && params.personas <= 40;

    if (!isValidDate || !isValidTime || !isValidPeople) {
      console.error('Invalid parameters received!');
      const response: VapiToolResponse = {
        results: [{
          toolCallId: toolCallId,
          result: 'Lo siento, los datos de la reserva no son válidos. Por favor, intente nuevamente.'
        }]
      };
      return res.status(200).json(response);
    }

    console.log('✓ Data validation passed');
    console.log('✓ Checking availability with TheFork scraper...');

    // Check availability using TheFork scraper
    const availability = await theForkScraper.checkAvailability(
      correctedDate,
      params.hora,
      params.personas
    );

    let availabilityMessage: string;

    if (availability.available) {
      // Time is available
      availabilityMessage = `Perfecto, tenemos disponibilidad para ${params.personas} personas el ${params.fecha} a las ${params.hora}.`;
    } else if (availability.availableTimes && availability.availableTimes.length > 0) {
      // Date is available but not this specific time - offer alternatives
      const timesList = availability.availableTimes.slice(0, 3).join(', ');
      availabilityMessage = `Lo siento, no tenemos disponibilidad a las ${params.hora}. Tenemos disponibilidad a las siguientes horas: ${timesList}. ¿Le gustaría reservar en alguno de estos horarios?`;
    } else {
      // No availability at all for this date
      availabilityMessage = `Lo siento, no tenemos disponibilidad para ${params.personas} personas el ${params.fecha}. ¿Le gustaría probar con otra fecha?`;
    }

    const response: VapiToolResponse = {
      results: [{
        toolCallId: toolCallId,
        result: availabilityMessage
      }]
    };

    console.log('Responding with:', availabilityMessage);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in checkAvailability:', error);

    // Try to extract toolCallId for error response
    let errorToolCallId = 'unknown';
    try {
      const { message } = req.body;
      if (message?.type === 'tool-calls' && message?.toolCalls?.[0]?.id) {
        errorToolCallId = message.toolCalls[0].id;
      } else if (message?.functionCall?.id) {
        errorToolCallId = message.functionCall.id;
      }
    } catch {}

    // Return a user-friendly error message to Vapi
    const response: VapiToolResponse = {
      results: [{
        toolCallId: errorToolCallId,
        result: 'Lo siento, hubo un problema al verificar la disponibilidad. Por favor, intente nuevamente en un momento.'
      }]
    };

    res.status(200).json(response);
  }
};
