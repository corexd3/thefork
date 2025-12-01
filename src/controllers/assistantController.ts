import { Request, Response } from 'express';
import { processReservation } from './reservationController';

/**
 * Get Spanish day of week name
 */
function getDayOfWeekSpanish(date: Date): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[date.getDay()];
}

/**
 * Get Spanish month name
 */
function getMonthSpanish(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return months[date.getMonth()];
}

/**
 * Generate the current date context message for the assistant
 */
function generateDateContext(): string {
  const now = new Date();
  const dayOfWeek = getDayOfWeekSpanish(now);
  const day = now.getDate();
  const month = getMonthSpanish(now);
  const year = now.getFullYear();
  const dateISO = now.toISOString().split('T')[0]; // YYYY-MM-DD

  return `
=== INFORMACIÓN DE FECHA Y HORA ACTUAL ===
FECHA DE HOY: ${dayOfWeek}, ${day} de ${month} de ${year}
FECHA EN FORMATO ISO: ${dateISO}
AÑO ACTUAL: ${year}

REGLAS CRÍTICAS PARA MANEJO DE FECHAS:
1. Cuando el usuario mencione una fecha SIN especificar el año (ejemplos: "3 de diciembre", "el viernes", "mañana", "la próxima semana"), SIEMPRE asume el año ${year}.
2. Si la fecha mencionada ya pasó en ${year}, usa el año ${year + 1}.
3. NUNCA uses años anteriores como 2023 o 2024.
4. Para calcular qué día de la semana es una fecha, recuerda que HOY es ${dayOfWeek} ${day} de ${month} de ${year}.
5. Cuando envíes la fecha al sistema (función checkAvailabilityALAKRAN), usa SIEMPRE el formato YYYY-MM-DD con el año correcto.

EJEMPLOS:
- Si el usuario dice "el 15 de diciembre" → usa "${year}-12-15"
- Si el usuario dice "mañana" y hoy es ${dateISO} → calcula la fecha correcta
- Si el usuario dice "el viernes" → calcula cuál es el próximo viernes desde hoy
==========================================

`;
}

/**
 * Handle assistant-request event (START of call)
 * Injects current date context into the assistant's system prompt
 */
function handleAssistantRequestEvent(message: any): object {
  console.log('=== Assistant Request Event (Call Start) ===');
  console.log('🕐 Server time:', new Date().toISOString());
  console.log('📅 Current year:', new Date().getFullYear());

  // Log call information
  if (message?.call) {
    console.log('Call ID:', message.call.id);
    console.log('Phone Number:', message.call.customer?.number || 'N/A');
  }

  // Generate dynamic date context
  const dateContext = generateDateContext();
  console.log('Injecting current date context into assistant prompt');
  console.log('Date context being injected:\n', dateContext);

  // Return the assistant modification
  // This will be MERGED with the existing assistant configuration from Vapi dashboard
  // Only include fields you want to override or add
  return {
    assistant: {
      // Note: firstMessage is NOT included here, so it uses the one from Vapi dashboard
      model: {
        messages: [
          {
            role: "system",
            content: dateContext
          }
        ]
      }
    }
  };
}

/**
 * Main Server URL handler for Vapi
 * Routes different event types to appropriate handlers
 *
 * Vapi sends these event types to the Server URL:
 * - assistant-request: START of call - customize assistant dynamically
 * - function-call / tool-calls: Function invocation during call
 * - status-update: Call status changes
 * - end-of-call-report: Call ends with summary
 * - conversation-update: Real-time conversation updates
 * - transcript: Transcript updates
 */
export const handleAssistantRequest = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    // Vapi may send type at root level OR inside message object
    const messageType = req.body.type || message?.type;

    console.log('=== Vapi Server URL Webhook ===');
    console.log('Event Type:', messageType || 'unknown');
    console.log('Raw request body keys:', Object.keys(req.body));

    // Debug: Log full body for assistant-request to understand structure
    if (!messageType || messageType === 'assistant-request') {
      console.log('Full request body:', JSON.stringify(req.body, null, 2).substring(0, 1000));
    }

    switch (messageType) {
      case 'assistant-request':
        // Call is starting - inject date context
        const assistantResponse = handleAssistantRequestEvent(message || req.body);
        return res.status(200).json(assistantResponse);

      case 'status-update':
        // Call status changed (e.g., ringing, in-progress, ended)
        console.log('Status Update:', message.status);
        return res.status(200).json({});

      case 'conversation-update':
        // Real-time conversation update
        console.log('Conversation Update received');
        return res.status(200).json({});

      case 'end-of-call-report':
        // Call ended - process reservation silently if structured data exists
        // Return empty response so assistant doesn't read JSON aloud
        console.log('End of Call Report received');
        if (message.analysis?.structuredData?.reservation) {
          console.log('Reservation data found, processing silently...');
          const result = await processReservation(message);
          if (result.success) {
            console.log('✓ Reservation processed successfully');
          } else {
            console.error('✗ Reservation processing failed:', result.error);
          }
        } else {
          console.log('No reservation data in end-of-call report');
        }
        // Always return empty response for end-of-call-report
        return res.status(200).json({});

      case 'function-call':
      case 'tool-calls':
        // Function/tool calls are handled by their dedicated endpoint
        // (/webhooks/check-availability for checkAvailabilityALAKRAN)
        console.log('Function/Tool call received - handled by dedicated tool endpoint');
        return res.status(200).json({});

      default:
        console.log('Unhandled event type:', messageType);
        console.log('Full message:', JSON.stringify(message, null, 2));
        return res.status(200).json({});
    }

  } catch (error) {
    console.error('Error in Server URL handler:', error);
    // Return empty response on error (Vapi will use default config)
    res.status(200).json({});
  }
};
