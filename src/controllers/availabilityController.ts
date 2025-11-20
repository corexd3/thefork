import { Request, Response } from 'express';
import { CheckAvailabilityParams, VapiToolResponse } from '../types/vapi';

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

    // TODO: When API is available, integrate with restaurant reservation system
    // For now, we'll simulate availability check and log the data

    // Validate the received data format
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(params.fecha);
    const isValidTime = /^\d{2}:\d{2}$/.test(params.hora);
    const isValidPeople = params.personas > 0 && params.personas < 100;

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

    // Simulate availability check
    console.log('✓ Data validation passed');
    console.log('✓ Simulating availability check...');

    // TODO: Replace this with actual API call
    // const availability = await restaurantAPI.checkAvailability(params);

    // For now, return a success message to Vapi
    const availabilityMessage = `Perfecto, tenemos disponibilidad para ${params.personas} personas el ${params.fecha} a las ${params.hora}. ¿Desea confirmar la reserva?`;

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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
