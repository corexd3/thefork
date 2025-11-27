import { Request, Response } from 'express';
import { ReservationData, VapiWebhookResponse } from '../types/vapi';
import { theForkScraper } from '../services/theForkScraper';
import { parseSpanishDate } from '../utils/dateParser';

/**
 * Process reservation logic (shared between endpoints)
 * Returns the result without sending HTTP response
 */
export const processReservation = async (message: any): Promise<{ success: boolean; error?: string }> => {
  try {
    const reservationData: ReservationData = message.analysis.structuredData.reservation;
    const customerPhone = message.call?.customer?.number || 'Unknown';

    console.log('Processing reservation:');
    console.log('- Phone Number:', customerPhone);
    console.log('- Date:', reservationData.date);
    console.log('- Time:', reservationData.time);
    console.log('- People:', reservationData.people);
    console.log('- Full Name:', reservationData.full_name);

    // Parse and correct date format
    const currentYear = new Date().getFullYear();
    let correctedDate = parseSpanishDate(reservationData.date);

    if (!correctedDate) {
      console.error('❌ Could not parse date:', reservationData.date);
      return { success: false, error: `Invalid date format: "${reservationData.date}"` };
    }

    // Check if year needs correction
    const yearFromDate = parseInt(correctedDate.split('-')[0]);
    if (yearFromDate < currentYear || yearFromDate > currentYear + 1) {
      const monthDay = correctedDate.substring(4);
      correctedDate = `${currentYear}${monthDay}`;
      console.log('⚠️  Auto-corrected year to', correctedDate);
    }

    // Validate the received data
    if (!correctedDate || !reservationData.time || reservationData.people <= 0 || !reservationData.full_name) {
      console.error('Incomplete reservation data!');
      return { success: false, error: 'Incomplete reservation data' };
    }

    // Parse customer name
    const nameParts = reservationData.full_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Build special requests string
    let specialRequests = reservationData.special_requests || '';
    if (reservationData.baby) {
      specialRequests = specialRequests ? `${specialRequests}. Llegará con bebé.` : 'Llegará con bebé.';
    }
    if (reservationData.allergies && reservationData.allergies !== 'none') {
      specialRequests = specialRequests ? `${specialRequests}. Alergias: ${reservationData.allergies}` : `Alergias: ${reservationData.allergies}`;
    }

    // Make reservation using TheFork scraper
    const reservationResult = await theForkScraper.makeReservation(
      correctedDate,
      reservationData.time,
      reservationData.people,
      {
        firstName,
        lastName,
        email: 'hola@haciendalakran.com',
        phone: customerPhone,
        honorific: reservationData.honorific,
        specialRequests: specialRequests || undefined
      }
    );

    if (!reservationResult.success) {
      console.error('✗ Reservation failed:', reservationResult.message);
      return { success: false, error: reservationResult.message };
    }

    console.log('✓ Reservation created successfully!');
    console.log('Confirmation:', reservationResult.confirmationNumber || `ALAKRAN-${Date.now()}`);

    return { success: true };

  } catch (error) {
    console.error('Error processing reservation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Controller for handling completed reservations
 * This is called at the end of the conversation when Vapi sends the structured data
 */
export const completeReservation = async (req: Request, res: Response) => {
  try {
    console.log('=== Reservation Completion Request ===');

    // Extract reservation data from Vapi webhook
    // Note: structuredData is nested inside message.analysis.structuredData
    const { message } = req.body;
    const reservationData: ReservationData = message.analysis.structuredData.reservation;

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

    // FIX: Parse and correct date format
    const currentYear = new Date().getFullYear();
    let correctedDate: string | null;

    // Try to parse the date (handles ISO and Spanish formats)
    correctedDate = parseSpanishDate(reservationData.date);

    if (!correctedDate) {
      console.error('❌ Could not parse date:', reservationData.date);
      const response: VapiWebhookResponse = {
        success: false,
        message: `Invalid date format: "${reservationData.date}". Could not parse date.`
      };
      return res.status(400).json(response);
    }

    // Check if year needs correction
    const yearFromDate = parseInt(correctedDate.split('-')[0]);
    if (yearFromDate < currentYear || yearFromDate > currentYear + 1) {
      const monthDay = correctedDate.substring(4);
      correctedDate = `${currentYear}${monthDay}`;
      console.log('⚠️  Auto-corrected year from', reservationData.date, 'to', correctedDate);
    }

    // Validate the received data
    const isComplete = correctedDate &&
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
    console.log('✓ Creating reservation with TheFork scraper...');

    // Parse customer name
    const nameParts = reservationData.full_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one name provided

    // Build special requests string
    let specialRequests = reservationData.special_requests || '';
    if (reservationData.baby) {
      specialRequests = specialRequests
        ? `${specialRequests}. Llegará con bebé.`
        : 'Llegará con bebé.';
    }
    if (reservationData.allergies && reservationData.allergies !== 'none') {
      specialRequests = specialRequests
        ? `${specialRequests}. Alergias: ${reservationData.allergies}`
        : `Alergias: ${reservationData.allergies}`;
    }

    // Make reservation using TheFork scraper
    const reservationResult = await theForkScraper.makeReservation(
      correctedDate,
      reservationData.time,
      reservationData.people,
      {
        firstName,
        lastName,
        // email: 'hola@haciendalakran.com', // Use restaurant email or extract from structured data
        email: 'hola@haciendalakran.com',
        phone: customerPhone,
        honorific: reservationData.honorific,
        specialRequests: specialRequests || undefined
      }
    );

    if (!reservationResult.success) {
      console.error('✗ Reservation failed:', reservationResult.message);
      const response: VapiWebhookResponse = {
        success: false,
        message: `Failed to create reservation: ${reservationResult.message}`
      };
      return res.status(500).json(response);
    }

    console.log('✓ Reservation created successfully!');

    // Prepare summary for logging
    const summary = {
      reservationId: reservationResult.confirmationNumber || `ALAKRAN-${Date.now()}`,
      customer: `${reservationData.honorific} ${reservationData.full_name}`,
      phoneNumber: customerPhone,
      dateTime: `${correctedDate} at ${reservationData.time}`,
      guestCount: reservationData.people,
      hasBaby: reservationData.baby,
      allergies: reservationData.allergies || 'None',
      specialRequests: reservationData.special_requests || 'None',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      source: 'TheFork Widget'
    };

    console.log('\n--- Reservation Summary ---');
    console.log(JSON.stringify(summary, null, 2));
    console.log('---------------------------\n');

    // Send success response
    const response: VapiWebhookResponse = {
      success: true,
      message: 'Reservation confirmed successfully',
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
