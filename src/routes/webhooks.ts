import { Router } from 'express';
import { checkAvailability } from '../controllers/availabilityController';
import { completeReservation } from '../controllers/reservationController';
import { handleAssistantRequest } from '../controllers/assistantController';
import { validateRequest, verifyWebhookSecret } from '../middleware/validator';
import { CheckAvailabilitySchema, ReservationCompletionSchema } from '../types/vapi';

const router = Router();

/**
 * POST /webhooks/assistant-request
 * Server URL webhook for dynamic assistant configuration
 * Called by Vapi at the START of each call to inject current date/time context
 *
 * Configure this in Vapi Dashboard:
 * 1. Go to your Assistant settings
 * 2. Set "Server URL" to: https://your-domain.com/webhooks/assistant-request
 * 3. The assistant will now receive current date context at the start of each call
 */
router.post(
  '/assistant-request',
  handleAssistantRequest
);

/**
 * POST /webhooks/check-availability
 * Webhook for checking restaurant availability during conversation
 * Called by Vapi when the checkAvailabilityALAKRAN function is invoked
 */
router.post(
  '/check-availability',
  // verifyWebhookSecret,
  validateRequest(CheckAvailabilitySchema),
  checkAvailability
);

/**
 * POST /webhooks/reservation-complete
 * Webhook for handling completed reservations
 * Called by Vapi at the end of the call with structured data
 */
router.post(
  '/reservation-complete',
  // verifyWebhookSecret,
  validateRequest(ReservationCompletionSchema),
  completeReservation
);

export default router;
