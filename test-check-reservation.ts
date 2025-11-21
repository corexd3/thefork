/**
 * Check if reservation appears in TheFork system
 * Opens the widget and takes a screenshot after submission
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const THEFORK_WIDGET_URL = 'https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466';

async function checkReservation() {
  console.log('Creating a test reservation and checking the result...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  try {
    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`Making reservation for ${dateStr} at 20:00\n`);

    // Navigate
    await page.goto(THEFORK_WIDGET_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Select date
    console.log('1. Selecting date...');
    const dateButton = await page.$(`[data-testid="date-${dateStr}"]`);
    if (dateButton && !(await dateButton.isDisabled())) {
      await dateButton.click();
      await page.waitForTimeout(1500);
    }

    // Select people
    console.log('2. Selecting 2 people...');
    const persButton = await page.$('[data-testid="filter-button-dph-pax"]');
    if (persButton) {
      await persButton.click();
      await page.waitForTimeout(1000);

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes('2')) {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(1500);
    }

    // Select time
    console.log('3. Selecting time 20:00...');
    const hourButton = await page.$('[data-testid="filter-button-dph-hour"]');
    if (hourButton) {
      await hourButton.click();
      await page.waitForTimeout(2000);

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes('20:00')) {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(2000);
    }

    // Fill form
    console.log('4. Filling contact form...');
    const selectors = {
      firstName: ['input#contact-information-firstName', 'input[name="firstName"]'],
      lastName: ['input#contact-information-lastName', 'input[name="lastName"]'],
      email: ['input#contact-information-email', 'input[type="email"]', 'input[name="email"]'],
      phone: ['input#contact-information-phone-number', 'input[type="tel"]', 'input[name="phone"]']
    };

    // Fill first name
    for (const sel of selectors.firstName) {
      const input = await page.$(sel);
      if (input) {
        await input.fill('Hacienda');
        break;
      }
    }

    // Fill last name
    for (const sel of selectors.lastName) {
      const input = await page.$(sel);
      if (input) {
        await input.fill('Lakran');
        break;
      }
    }

    // Fill email
    for (const sel of selectors.email) {
      const input = await page.$(sel);
      if (input) {
        await input.fill('liancole0018@gmail.com');
        console.log('   ✓ Email filled: liancole0018@gmail.com');
        break;
      }
    }

    // Fill phone
    for (const sel of selectors.phone) {
      const input = await page.$(sel);
      if (input) {
        await input.fill('+34655720245');
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Take screenshot before submit
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    const beforeScreenshot = path.join(screenshotsDir, `before-submit-${Date.now()}.png`);
    await page.screenshot({ path: beforeScreenshot, fullPage: true });
    console.log(`\n📸 Screenshot saved: ${beforeScreenshot}`);

    // Submit
    console.log('\n5. Submitting reservation...');
    const submitButton = await page.$('button[type="submit"], [data-testid="contact-form-next-button"]');

    if (submitButton) {
      await submitButton.click();
      console.log('   ✓ Submit button clicked!');

      // Wait for response
      console.log('\n⏳ Waiting 5 seconds for confirmation page...\n');
      await page.waitForTimeout(5000);

      // Take screenshot after submit
      const afterScreenshot = path.join(screenshotsDir, `after-submit-${Date.now()}.png`);
      await page.screenshot({ path: afterScreenshot, fullPage: true });
      console.log(`📸 Screenshot saved: ${afterScreenshot}`);

      // Check URL
      const currentUrl = page.url();
      console.log('\n📍 Current URL:', currentUrl);

      // Check for confirmation indicators
      const pageText = await page.textContent('body');

      if (pageText) {
        const indicators = [
          'confirmation',
          'confirmed',
          'success',
          'thank you',
          'gracias',
          'confirmación',
          'confirmado',
          'réservation confirmée'
        ];

        const found = indicators.filter(ind =>
          pageText.toLowerCase().includes(ind)
        );

        if (found.length > 0) {
          console.log('\n✅ RESERVATION APPEARS TO BE CONFIRMED!');
          console.log('   Found indicators:', found);
        } else {
          console.log('\n⚠️  No confirmation indicators found');
          console.log('   This might mean:');
          console.log('   - Form validation error');
          console.log('   - Missing required field');
          console.log('   - TheFork rejected the submission');
        }

        // Look for error messages
        if (pageText.includes('error') || pageText.includes('invalid') ||
            pageText.includes('required') || pageText.includes('obligatorio')) {
          console.log('\n❌ POSSIBLE ERROR DETECTED!');
          console.log('   Check the screenshot for error messages.');
        }

        // Try to find confirmation number
        const confirmMatch = pageText.match(/(?:confirmation|booking|reservation)[\s#:]+([A-Z0-9-]+)/i);
        if (confirmMatch) {
          console.log('\n🎫 Confirmation Number:', confirmMatch[1]);
        }
      }

      console.log('\n\n=== IMPORTANT ===');
      console.log('Check the screenshots in the screenshots/ folder:');
      console.log('1. Before submit - verify all fields are filled');
      console.log('2. After submit - see if there\'s a confirmation or error');
      console.log('\nBrowser will stay open for 30 seconds so you can inspect...\n');

      await page.waitForTimeout(30000);

    } else {
      console.error('❌ Submit button not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkReservation();
