import { Request, Response } from 'express';
import { ReservationData, VapiWebhookResponse } from '../types/vapi';

/**
 * Controller for handling completed reservations
 * This is called at the end of the conversation when Vapi sends the structured data
 */
export const completeReservation = async (req: Request, res: Response) => {
  try {
    console.log('=== Reservation Completion Request ===');

    // Extract reservation data from Vapi webhook
    const { message } = req.body;
    const reservationData: ReservationData = message.structuredData.reservation;

    // Extract customer phone number from call data
    const customerPhone = message.call?.customer?.number || 'Unknown';

    console.log('Received reservation data:');
    console.log('- Phone Number:', customerPhone);
    console.log('- Date:', reservationData.date);
    console.log('- Time:', reservationData.time);
    console.log('- People:', reservationData.people);
    console.log('- Full Name:', reservationData.full_name);
    console.log('- Honorific:', reservationData.honorific);
    console.log('- Baby:', reservationData.baby);
    console.log('- Allergies:', reservationData.allergies);
    console.log('- Special Requests:', reservationData.special_requests);

    // Validate the received data
    const isComplete = reservationData.date &&
                       reservationData.time &&
                       reservationData.people > 0 &&
                       reservationData.full_name;

    if (!isComplete) {
      console.error('Incomplete reservation data received!');
      const response: VapiWebhookResponse = {
        success: false,
        message: 'Incomplete reservation data'
      };
      return res.status(400).json(response);
    }

    console.log('✓ All required fields present');

    // TODO: When API is available, create the reservation in the restaurant system
    // Example:
    // const reservationResult = await restaurantAPI.createReservation({
    //   date: reservationData.date,
    //   time: reservationData.time,
    //   numberOfGuests: reservationData.people,
    //   customerName: reservationData.full_name,
    //   customerPhone: customerPhone,
    //   honorific: reservationData.honorific,
    //   hasBaby: reservationData.baby,
    //   allergies: reservationData.allergies,
    //   specialRequests: reservationData.special_requests
    // });

    // Simulate successful reservation creation
    console.log('✓ Simulating reservation creation...');
    console.log('✓ Reservation would be created with this data');

    // Prepare summary for logging
    const summary = {
      reservationId: `ALAKRAN-${Date.now()}`, // Simulated ID
      customer: `${reservationData.honorific} ${reservationData.full_name}`,
      phoneNumber: customerPhone,
      dateTime: `${reservationData.date} at ${reservationData.time}`,
      guestCount: reservationData.people,
      hasBaby: reservationData.baby,
      allergies: reservationData.allergies || 'None',
      specialRequests: reservationData.special_requests || 'None',
      status: 'pending_confirmation',
      createdAt: new Date().toISOString()
    };

    console.log('\n--- Reservation Summary ---');
    console.log(JSON.stringify(summary, null, 2));
    console.log('---------------------------\n');

    // Send success response
    const response: VapiWebhookResponse = {
      success: true,
      message: 'Reservation received successfully',
      data: summary
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in completeReservation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
