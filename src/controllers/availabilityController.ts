import { Request, Response } from 'express';
import { CheckAvailabilityParams, VapiToolResponse } from '../types/vapi';
import { theForkScraper } from '../services/theForkScraper';

/**
 * Controller for checking restaurant availability
 * This is called during the conversation when Vapi executes the checkAvailabilityALAKRAN function
 */
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    console.log('=== Check Availability Request ===');

    // Extract parameters from Vapi webhook
    const { message } = req.body;
    const params: CheckAvailabilityParams = message.functionCall.parameters;

    console.log('Received parameters:');
    console.log('- Fecha (Date):', params.fecha);
    console.log('- Hora (Time):', params.hora);
    console.log('- Personas (People):', params.personas);

    // Validate the received data format
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(params.fecha);
    const isValidTime = /^\d{2}:\d{2}$/.test(params.hora);
    const isValidPeople = params.personas > 0 && params.personas <= 40;

    if (!isValidDate || !isValidTime || !isValidPeople) {
      console.error('Invalid parameters received!');
      const response: VapiToolResponse = {
        results: [{
          toolCallId: message.functionCall.id || 'unknown',
          result: 'Lo siento, los datos de la reserva no son válidos. Por favor, intente nuevamente.'
        }]
      };
      return res.status(200).json(response);
    }

    console.log('✓ Data validation passed');
    console.log('✓ Checking availability with TheFork scraper...');

    // Check availability using TheFork scraper
    const availability = await theForkScraper.checkAvailability(
      params.fecha,
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
        toolCallId: message.functionCall.id || 'unknown',
        result: availabilityMessage
      }]
    };

    console.log('Responding with:', availabilityMessage);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in checkAvailability:', error);

    // Return a user-friendly error message to Vapi
    const response: VapiToolResponse = {
      results: [{
        toolCallId: req.body.message?.functionCall?.id || 'unknown',
        result: 'Lo siento, hubo un problema al verificar la disponibilidad. Por favor, intente nuevamente en un momento.'
      }]
    };

    res.status(200).json(response);
  }
};
