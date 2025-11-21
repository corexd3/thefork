/**
 * Debug version of scraper test - shows browser window
 */

import { chromium } from 'playwright';

const THEFORK_WIDGET_URL = 'https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466';

async function debugReservation() {
  console.log('Opening browser in VISIBLE mode...');
  console.log('You will see the browser window - watch what happens!\n');

  const browser = await chromium.launch({
    headless: false,  // Show the browser!
    slowMo: 500       // Slow down actions so you can see them
  });

  const page = await browser.newPage();

  try {
    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`Testing reservation for ${dateStr} at 20:00\n`);

    // 1. Navigate to widget
    console.log('1. Navigating to TheFork widget...');
    await page.goto(THEFORK_WIDGET_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 2. Select date
    console.log('2. Clicking date button...');
    const dateSelector = `[data-testid="date-${dateStr}"]`;
    const dateButton = await page.$(dateSelector);

    if (!dateButton) {
      console.error('❌ Date button not found!');
      await browser.close();
      return;
    }

    const isDisabled = await dateButton.isDisabled();
    if (isDisabled) {
      console.error('❌ Date is disabled!');
      await browser.close();
      return;
    }

    await dateButton.click();
    console.log('✓ Date clicked');
    await page.waitForTimeout(2000);

    // 3. Select people
    console.log('3. Selecting 2 people...');
    const persButton = await page.$('[data-testid="filter-button-dph-pax"]');
    if (persButton) {
      await persButton.click();
      await page.waitForTimeout(1000);

      // Look for "2" button
      const peopleButtons = await page.$$('button');
      for (const btn of peopleButtons) {
        const text = await btn.textContent();
        if (text && text.includes('2')) {
          await btn.click();
          console.log('✓ Selected 2 people');
          break;
        }
      }
      await page.waitForTimeout(1000);
    }

    // 4. Select time
    console.log('4. Selecting time 20:00...');
    const hourButton = await page.$('[data-testid="filter-button-dph-hour"]');
    if (hourButton) {
      await hourButton.click();
      await page.waitForTimeout(2000);

      // Find 20:00 button
      const timeButtons = await page.$$('button');
      for (const btn of timeButtons) {
        const text = await btn.textContent();
        if (text && text.includes('20:00')) {
          await btn.click();
          console.log('✓ Selected 20:00');
          break;
        }
      }
      await page.waitForTimeout(2000);
    }

    // 5. Fill contact form
    console.log('5. Filling contact information...');
    await page.waitForTimeout(2000);

    // Try to find and fill firstName
    console.log('   Looking for first name input...');
    const firstNameSelectors = [
      'input[name="firstName"]',
      'input#contact-information-firstName',
      '[data-testid="contact-information-firstName"]',
      'input[placeholder*="First"]',
      'input[placeholder*="Nombre"]'
    ];

    let filled = false;
    for (const selector of firstNameSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill('Hacienda');
        console.log(`   ✓ Filled first name with selector: ${selector}`);
        filled = true;
        break;
      }
    }
    if (!filled) {
      console.log('   ⚠️  Could not find first name input');
    }

    // Try to find and fill lastName
    console.log('   Looking for last name input...');
    const lastNameSelectors = [
      'input[name="lastName"]',
      'input#contact-information-lastName',
      '[data-testid="contact-information-lastName"]',
      'input[placeholder*="Last"]',
      'input[placeholder*="Apellido"]'
    ];

    filled = false;
    for (const selector of lastNameSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill('Lakran');
        console.log(`   ✓ Filled last name with selector: ${selector}`);
        filled = true;
        break;
      }
    }
    if (!filled) {
      console.log('   ⚠️  Could not find last name input');
    }

    // Email
    console.log('   Looking for email input...');
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input#contact-information-email',
      '[data-testid="contact-information-email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]'
    ];

    filled = false;
    for (const selector of emailSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill('liancole0018@gmail.com');
        console.log(`   ✓ Filled email with selector: ${selector}`);
        filled = true;
        break;
      }
    }
    if (!filled) {
      console.log('   ⚠️  Could not find email input');
    }

    // Phone
    console.log('   Looking for phone input...');
    const phoneSelectors = [
      'input[name="phone"]',
      'input[type="tel"]',
      'input#contact-information-phone-number',
      '[data-testid="contact-information-phone-number"]',
      'input[placeholder*="phone"]',
      'input[placeholder*="Phone"]',
      'input[placeholder*="Teléfono"]'
    ];

    filled = false;
    for (const selector of phoneSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill('+34655720245');
        console.log(`   ✓ Filled phone with selector: ${selector}`);
        filled = true;
        break;
      }
    }
    if (!filled) {
      console.log('   ⚠️  Could not find phone input');
    }

    await page.waitForTimeout(2000);

    // 6. Submit
    console.log('6. Looking for submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      '[data-testid="contact-form-next-button"]',
      'button:has-text("Confirm")',
      'button:has-text("Confirmar")',
      'button:has-text("Next")',
      'button:has-text("Siguiente")'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        const isVisible = await btn.isVisible();
        if (isVisible) {
          submitButton = btn;
          console.log(`   ✓ Found submit button with selector: ${selector}`);
          break;
        }
      }
    }

    if (submitButton) {
      console.log('7. Clicking submit button...');
      await submitButton.click();
      console.log('   ✓ Submit button clicked!');

      console.log('\n⏳ Waiting 10 seconds to see what happens...');
      console.log('   Watch the browser window!\n');
      await page.waitForTimeout(10000);

      // Check if we're on a confirmation page
      const url = page.url();
      console.log('Current URL:', url);

      const bodyText = await page.textContent('body');
      console.log('\nPage contains:', bodyText?.substring(0, 500));

    } else {
      console.error('❌ No submit button found!');
    }

    console.log('\n\n=== DEBUGGING COMPLETE ===');
    console.log('The browser will stay open for 30 more seconds.');
    console.log('Look at the page - did the reservation submit?');
    console.log('Check for confirmation message or errors.\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

debugReservation();
