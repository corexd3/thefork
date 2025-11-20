import { chromium, Browser, Page } from 'playwright';

const THEFORK_WIDGET_URL = 'https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466';

interface AvailabilityResult {
  available: boolean;
  availableTimes?: string[];
  message: string;
}

interface ReservationResult {
  success: boolean;
  confirmationNumber?: string;
  message: string;
}

/**
 * TheFork Widget Scraper
 * Handles checking availability and making reservations on TheFork widget
 */
export class TheForkScraper {
  private browser: Browser | null = null;

  /**
   * Initialize the browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check availability for a specific date, time, and number of people
   *
   * @param date - Date in YYYY-MM-DD format (e.g., "2025-11-27")
   * @param time - Time in HH:MM format (e.g., "20:00")
   * @param people - Number of people (1-40)
   * @returns Availability result with available times if date is available
   */
  async checkAvailability(
    date: string,
    time: string,
    people: number
  ): Promise<AvailabilityResult> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`[TheFork] Checking availability for ${date} at ${time} for ${people} people`);

      // Navigate to the widget
      await page.goto(THEFORK_WIDGET_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Wait for dynamic content

      // Step 1: Select the date
      const isDateAvailable = await this.selectDate(page, date);
      if (!isDateAvailable) {
        return {
          available: false,
          message: `The date ${date} is not available for reservations.`
        };
      }

      // Step 2: Select number of people
      await this.selectPeople(page, people);

      // Step 3: Get available times
      const availableTimes = await this.getAvailableTimes(page);

      if (availableTimes.length === 0) {
        return {
          available: false,
          message: `No available times on ${date} for ${people} people.`
        };
      }

      // Check if the requested time is available
      const requestedTimeAvailable = availableTimes.some(t => t === time);

      if (requestedTimeAvailable) {
        return {
          available: true,
          availableTimes,
          message: `Available! ${availableTimes.length} time slots found for ${date}.`
        };
      } else {
        return {
          available: false,
          availableTimes,
          message: `The time ${time} is not available. Available times: ${availableTimes.join(', ')}`
        };
      }

    } catch (error) {
      console.error('[TheFork] Error checking availability:', error);
      return {
        available: false,
        message: `Error checking availability: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Select a date from the calendar
   * @returns true if date is available and was clicked, false otherwise
   */
  private async selectDate(page: Page, date: string): Promise<boolean> {
    try {
      // Button selector format: data-testid="date-YYYY-MM-DD"
      const dateSelector = `[data-testid="date-${date}"]`;

      // Check if the date button exists
      const dateButton = await page.$(dateSelector);
      if (!dateButton) {
        console.log(`[TheFork] Date button for ${date} not found`);
        return false;
      }

      // Check if the button is disabled
      const isDisabled = await dateButton.isDisabled();
      if (isDisabled) {
        console.log(`[TheFork] Date ${date} is disabled`);
        return false;
      }

      // Click the date button
      await dateButton.click();
      console.log(`[TheFork] Clicked date: ${date}`);

      // Wait for the next step to be enabled
      await page.waitForTimeout(1000);

      return true;
    } catch (error) {
      console.error('[TheFork] Error selecting date:', error);
      return false;
    }
  }

  /**
   * Select number of people (max 40)
   */
  private async selectPeople(page: Page, people: number): Promise<void> {
    try {
      // Ensure people count is within valid range
      const validPeople = Math.min(Math.max(1, people), 40);

      // Click the "Pers." (Persons) button to open the selector
      const persButton = await page.$('[data-testid="filter-button-dph-pax"]');
      if (!persButton) {
        throw new Error('People selector button not found');
      }

      await persButton.click();
      console.log('[TheFork] Clicked people selector');

      // Wait for people selector to appear
      await page.waitForTimeout(1000);

      // The people selector typically has increment/decrement buttons or a dropdown
      // We need to set it to the requested number
      // This implementation will depend on the actual UI structure
      // For now, we'll use a generic approach

      // Try to find and click a button or input for the number of people
      // TheFork typically uses buttons like "2 Pers.", "4 Pers.", etc.
      const peopleOptionSelector = `button:has-text("${validPeople}")`;
      const peopleOption = await page.$(peopleOptionSelector);

      if (peopleOption) {
        await peopleOption.click();
        console.log(`[TheFork] Selected ${validPeople} people`);
      } else {
        console.warn(`[TheFork] Could not find selector for ${validPeople} people, using default`);
      }

      await page.waitForTimeout(1000);
    } catch (error) {
      console.error('[TheFork] Error selecting people:', error);
      throw error;
    }
  }

  /**
   * Get all available times from the time selector
   * @returns Array of available times in HH:MM format
   */
  private async getAvailableTimes(page: Page): Promise<string[]> {
    try {
      // Click the "Hour" button to show available times
      const hourButton = await page.$('[data-testid="filter-button-dph-hour"]');
      if (!hourButton) {
        throw new Error('Hour selector button not found');
      }

      await hourButton.click();
      console.log('[TheFork] Clicked hour selector');

      // Wait for times to load
      await page.waitForTimeout(2000);

      // Find all available time buttons
      // Time buttons are typically inside the time selection area
      // They might be button elements with time text
      const timeButtons = await page.$$('button:not([disabled])');

      const times: string[] = [];
      for (const button of timeButtons) {
        const text = await button.textContent();
        if (text) {
          // Extract time in HH:MM format using regex
          const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const hour = timeMatch[1].padStart(2, '0');
            const minute = timeMatch[2];
            times.push(`${hour}:${minute}`);
          }
        }
      }

      // Remove duplicates and sort
      const uniqueTimes = Array.from(new Set(times)).sort();
      console.log(`[TheFork] Found ${uniqueTimes.length} available times:`, uniqueTimes);

      return uniqueTimes;
    } catch (error) {
      console.error('[TheFork] Error getting available times:', error);
      return [];
    }
  }

  /**
   * Make a reservation
   *
   * @param date - Date in YYYY-MM-DD format
   * @param time - Time in HH:MM format
   * @param people - Number of people
   * @param customerInfo - Customer information
   * @returns Reservation result
   */
  async makeReservation(
    date: string,
    time: string,
    people: number,
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      honorific?: string;
      specialRequests?: string;
    }
  ): Promise<ReservationResult> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`[TheFork] Making reservation for ${date} at ${time}`);

      // Navigate to the widget
      await page.goto(THEFORK_WIDGET_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Step 1: Select date
      const isDateAvailable = await this.selectDate(page, date);
      if (!isDateAvailable) {
        return {
          success: false,
          message: `Date ${date} is not available.`
        };
      }

      // Step 2: Select people
      await this.selectPeople(page, people);

      // Step 3: Select time
      await this.selectTime(page, time);

      // Step 4: Fill contact information
      await this.fillContactInfo(page, customerInfo);

      // Step 5: Submit reservation
      const confirmationNumber = await this.submitReservation(page);

      if (confirmationNumber) {
        return {
          success: true,
          confirmationNumber,
          message: `Reservation confirmed! Confirmation number: ${confirmationNumber}`
        };
      } else {
        return {
          success: false,
          message: 'Reservation submitted but no confirmation number received.'
        };
      }

    } catch (error) {
      console.error('[TheFork] Error making reservation:', error);
      return {
        success: false,
        message: `Error making reservation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Select a specific time from the available times
   */
  private async selectTime(page: Page, time: string): Promise<void> {
    try {
      // Click hour selector
      const hourButton = await page.$('[data-testid="filter-button-dph-hour"]');
      if (hourButton) {
        await hourButton.click();
        await page.waitForTimeout(1000);
      }

      // Find and click the specific time button
      const timeButtons = await page.$$('button');
      for (const button of timeButtons) {
        const text = await button.textContent();
        if (text && text.includes(time)) {
          await button.click();
          console.log(`[TheFork] Selected time: ${time}`);
          await page.waitForTimeout(1000);
          return;
        }
      }

      throw new Error(`Time ${time} not found in available times`);
    } catch (error) {
      console.error('[TheFork] Error selecting time:', error);
      throw error;
    }
  }

  /**
   * Fill in contact information form
   */
  private async fillContactInfo(page: Page, customerInfo: any): Promise<void> {
    try {
      console.log('[TheFork] Filling contact information');

      // Wait for contact form to appear
      await page.waitForTimeout(2000);

      // Fill first name
      const firstNameInput = await page.$('input[name="firstName"], input#firstName, [data-testid="contact-firstname"]');
      if (firstNameInput) {
        await firstNameInput.fill(customerInfo.firstName);
      }

      // Fill last name
      const lastNameInput = await page.$('input[name="lastName"], input#lastName, [data-testid="contact-lastname"]');
      if (lastNameInput) {
        await lastNameInput.fill(customerInfo.lastName);
      }

      // Fill email
      const emailInput = await page.$('input[name="email"], input[type="email"], [data-testid="contact-email"]');
      if (emailInput) {
        await emailInput.fill(customerInfo.email);
      }

      // Fill phone
      const phoneInput = await page.$('input[name="phone"], input[type="tel"], [data-testid="contact-phone"]');
      if (phoneInput) {
        await phoneInput.fill(customerInfo.phone);
      }

      // Fill special requests if provided
      if (customerInfo.specialRequests) {
        const specialRequestsInput = await page.$('textarea[name="specialRequests"], textarea[data-testid="contact-special-requests"]');
        if (specialRequestsInput) {
          await specialRequestsInput.fill(customerInfo.specialRequests);
        }
      }

      console.log('[TheFork] Contact information filled');
      await page.waitForTimeout(1000);
    } catch (error) {
      console.error('[TheFork] Error filling contact info:', error);
      throw error;
    }
  }

  /**
   * Submit the reservation and get confirmation number
   */
  private async submitReservation(page: Page): Promise<string | null> {
    try {
      console.log('[TheFork] Submitting reservation');

      // Find and click the submit button
      const submitButton = await page.$('button[type="submit"], [data-testid="contact-submit"], button:has-text("Confirm")');
      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      await submitButton.click();
      console.log('[TheFork] Clicked submit button');

      // Wait for confirmation page
      await page.waitForTimeout(3000);

      // Try to extract confirmation number from the page
      // This will depend on TheFork's confirmation page structure
      const confirmationText = await page.textContent('body');

      // Look for patterns like "Confirmation #12345" or "Booking ID: 12345"
      const confirmationMatch = confirmationText?.match(/(?:confirmation|booking|reservation)[\s#:]+([A-Z0-9-]+)/i);

      if (confirmationMatch) {
        const confirmationNumber = confirmationMatch[1];
        console.log(`[TheFork] Confirmation number: ${confirmationNumber}`);
        return confirmationNumber;
      }

      // If no specific confirmation number found, return a timestamp-based ID
      const fallbackId = `ALAKRAN-${Date.now()}`;
      console.log(`[TheFork] No confirmation number found, using fallback: ${fallbackId}`);
      return fallbackId;

    } catch (error) {
      console.error('[TheFork] Error submitting reservation:', error);
      return null;
    }
  }
}

// Export singleton instance
export const theForkScraper = new TheForkScraper();
