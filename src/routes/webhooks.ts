import { Router } from 'express';
import { checkAvailability } from '../controllers/availabilityController';
import { completeReservation } from '../controllers/reservationController';
import { validateRequest, verifyWebhookSecret } from '../middleware/validator';
import { CheckAvailabilitySchema, ReservationCompletionSchema } from '../types/vapi';

const router = Router();

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
