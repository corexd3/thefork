/**
 * Test script for TheFork scraper
 * Tests availability checking and reservation making
 */

import { theForkScraper } from './src/services/theForkScraper';

async function testAvailability() {
  console.log('====================================');
  console.log('Testing Availability Check');
  console.log('====================================\n');

  // Test with a date that should be available (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Testing availability for ${dateStr} at 20:00 for 4 people\n`);

  try {
    const result = await theForkScraper.checkAvailability(dateStr, '20:00', 4);

    console.log('Result:');
    console.log('- Available:', result.available);
    console.log('- Message:', result.message);

    if (result.availableTimes) {
      console.log('- Available times:', result.availableTimes.join(', '));
    }

    console.log('\n✓ Availability check test completed\n');

    return result;
  } catch (error) {
    console.error('✗ Availability check test failed:', error);
    throw error;
  }
}

async function testReservation() {
  console.log('====================================');
  console.log('Testing Reservation Creation');
  console.log('====================================\n');

  // Test with tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  console.log(`Testing reservation for ${dateStr} at 20:00 for 2 people\n`);

  try {
    const result = await theForkScraper.makeReservation(
      dateStr,
      '20:00',
      2,
      {
        firstName: 'Hacienda',
        lastName: 'Lakran',
        email: 'hola@haciendalakran.com',
        phone: '+34655720245',
        honorific: 'Sr.',
        specialRequests: 'Test reservation from automated scraper'
      }
    );

    console.log('Result:');
    console.log('- Success:', result.success);
    console.log('- Message:', result.message);

    if (result.confirmationNumber) {
      console.log('- Confirmation Number:', result.confirmationNumber);
    }

    console.log('\n✓ Reservation test completed\n');

    return result;
  } catch (error) {
    console.error('✗ Reservation test failed:', error);
    throw error;
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════╗');
  console.log('║  TheFork Scraper Test Suite       ║');
  console.log('╚════════════════════════════════════╝');
  console.log('\n');

  try {
    // Test 1: Availability Check
    await testAvailability();

    // Test 2: Reservation Creation (commented out to avoid creating real reservations)
    // Uncomment if you want to test actual reservation creation
    // await testReservation();

    console.log('====================================');
    console.log('All tests completed successfully! ✓');
    console.log('====================================\n');

  } catch (error) {
    console.error('\n====================================');
    console.error('Tests failed! ✗');
    console.error('====================================\n');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the browser
    await theForkScraper.close();
  }
}

// Run tests
main();
