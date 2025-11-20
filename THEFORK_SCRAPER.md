# TheFork Widget Scraper Integration

## Overview

This document explains how the Hacienda Alakran webhook service integrates with TheFork's reservation widget using Playwright web scraping.

## Architecture

```
Vapi Call → Webhook → Controller → TheFork Scraper → TheFork Widget → Real Availability/Reservation
```

### Components

1. **TheFork Scraper** (`src/services/theForkScraper.ts`)
   - Playwright-based web scraper
   - Checks availability on TheFork widget
   - Creates real reservations

2. **Availability Controller** (`src/controllers/availabilityController.ts`)
   - Receives Vapi function calls
   - Validates parameters
   - Uses scraper to check availability
   - Returns results to Vapi assistant

3. **Reservation Controller** (`src/controllers/reservationController.ts`)
   - Receives end-of-call data from Vapi
   - Extracts reservation details
   - Uses scraper to create reservation
   - Confirms booking

---

## How It Works

### 1. Availability Check Flow

```
Customer: "Quiero reservar para el 27 de noviembre a las 20:00 para 4 personas"
        ↓
Vapi calls checkAvailabilityALAKRAN function
        ↓
availabilityController receives:
  - fecha: "2025-11-27"
  - hora: "20:00"
  - personas: 4
        ↓
TheForkScraper.checkAvailability():
  1. Opens TheFork widget in headless browser
  2. Clicks date button: [data-testid="date-2025-11-27"]
  3. Selects 4 people
  4. Gets available times from widget
  5. Checks if 20:00 is available
        ↓
Returns result to Vapi:
  - "Perfecto, tenemos disponibilidad..." (if available)
  - "No tenemos disponibilidad, pero tenemos..." (if other times available)
  - "No tenemos disponibilidad para esa fecha" (if no availability)
```

### 2. Reservation Creation Flow

```
Customer completes reservation conversation
        ↓
Vapi sends end-of-call-report with structured data
        ↓
reservationController receives:
  - date: "2025-11-27"
  - time: "20:00"
  - people: 4
  - full_name: "Juan Pérez García"
  - phone: "+34655720245"
  - allergies, special_requests, etc.
        ↓
TheForkScraper.makeReservation():
  1. Opens TheFork widget
  2. Selects date, people, and time
  3. Fills contact form:
     - First name: "Juan"
     - Last name: "Pérez García"
     - Email: restaurant email
     - Phone: customer phone
     - Special requests: allergies + baby info
  4. Submits reservation
  5. Extracts confirmation number
        ↓
Returns result:
  - success: true/false
  - confirmationNumber: "ALAKRAN-123456"
  - message: "Reservation confirmed!"
```

---

## TheFork Widget Structure

### Calendar (Date Selection)

```html
<button data-testid="date-2025-11-20" class="css-10ob89d ektx8jp0">20</button>
<button disabled data-testid="date-2025-11-21" class="css-10ob89d ektx8jp0">21</button>
```

- **Enabled buttons**: Available dates
- **Disabled buttons**: Unavailable dates
- **Selector**: `[data-testid="date-YYYY-MM-DD"]`

### Step Buttons

```html
<!-- Date button -->
<button aria-selected="true" data-testid="filter-button-dph-date">
  <div>Date</div>
</button>

<!-- People button -->
<button disabled data-testid="filter-button-dph-pax">
  <div>Pers.</div>
</button>

<!-- Time button -->
<button disabled data-testid="filter-button-dph-hour">
  <div>Hour</div>
</button>
```

### Flow

1. **Initial state**: Only Date button enabled
2. **After selecting date**: People button becomes enabled
3. **After selecting people**: Hour button becomes enabled
4. **After selecting time**: Contact form appears

---

## Implementation Details

### TheForkScraper Class

#### Methods

**`checkAvailability(date, time, people): Promise<AvailabilityResult>`**

Checks if a specific date/time is available.

```typescript
const result = await theForkScraper.checkAvailability(
  '2025-11-27',  // Date in YYYY-MM-DD format
  '20:00',       // Time in HH:MM format
  4              // Number of people (1-40)
);

// Returns:
// {
//   available: true,
//   availableTimes: ['19:00', '19:30', '20:00', '20:30'],
//   message: 'Available! 4 time slots found...'
// }
```

**`makeReservation(date, time, people, customerInfo): Promise<ReservationResult>`**

Creates an actual reservation on TheFork.

```typescript
const result = await theForkScraper.makeReservation(
  '2025-11-27',
  '20:00',
  4,
  {
    firstName: 'Juan',
    lastName: 'Pérez García',
    email: 'customer@example.com',
    phone: '+34655720245',
    honorific: 'Sr.',
    specialRequests: 'Mesa junto a la ventana'
  }
);

// Returns:
// {
//   success: true,
//   confirmationNumber: 'ALAKRAN-1732123456789',
//   message: 'Reservation confirmed!'
// }
```

#### Browser Configuration

```typescript
{
  headless: true,  // Runs without visible browser window
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}
```

---

## Scraper Logic

### Date Selection (`selectDate`)

1. Build selector: `[data-testid="date-${date}"]`
2. Find button element
3. Check if disabled
4. If enabled: click and wait
5. Return success/failure

```typescript
const dateSelector = `[data-testid="date-${date}"]`;
const dateButton = await page.$(dateSelector);
const isDisabled = await dateButton.isDisabled();

if (!isDisabled) {
  await dateButton.click();
  return true;
}
```

### People Selection (`selectPeople`)

1. Click people button: `[data-testid="filter-button-dph-pax"]`
2. Wait for selector to appear
3. Find button with number (e.g., "4 Pers.")
4. Click to select
5. Max: 40 people

```typescript
const persButton = await page.$('[data-testid="filter-button-dph-pax"]');
await persButton.click();

const peopleOption = await page.$(`button:has-text("${people}")`);
await peopleOption.click();
```

### Time Extraction (`getAvailableTimes`)

1. Click hour button: `[data-testid="filter-button-dph-hour"]`
2. Wait for times to load
3. Find all enabled time buttons
4. Extract time text with regex: `/(\d{1,2}):(\d{2})/`
5. Format as `HH:MM`
6. Remove duplicates and sort

```typescript
const timeButtons = await page.$$('button:not([disabled])');

for (const button of timeButtons) {
  const text = await button.textContent();
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    times.push(`${hour}:${minute}`);
  }
}
```

### Contact Form (`fillContactInfo`)

Fills multiple possible input selectors:

```typescript
const inputs = {
  firstName: 'input[name="firstName"], input#firstName, [data-testid="contact-firstname"]',
  lastName: 'input[name="lastName"], input#lastName, [data-testid="contact-lastname"]',
  email: 'input[name="email"], input[type="email"], [data-testid="contact-email"]',
  phone: 'input[name="phone"], input[type="tel"], [data-testid="contact-phone"]'
};
```

### Submission (`submitReservation`)

1. Find submit button
2. Click to submit
3. Wait for confirmation page (3 seconds)
4. Extract confirmation number with regex
5. Fallback to timestamp-based ID if not found

```typescript
const confirmationMatch = confirmationText?.match(
  /(?:confirmation|booking|reservation)[\s#:]+([A-Z0-9-]+)/i
);
```

---

## Integration with Controllers

### Availability Controller

```typescript
// Before (simulated)
const availabilityMessage = `Perfecto, tenemos disponibilidad...`;

// After (real check)
const availability = await theForkScraper.checkAvailability(
  params.fecha,
  params.hora,
  params.personas
);

if (availability.available) {
  return "Perfecto, tenemos disponibilidad...";
} else if (availability.availableTimes.length > 0) {
  return "No tenemos a esa hora, pero tenemos: " + times;
} else {
  return "No tenemos disponibilidad para esa fecha";
}
```

### Reservation Controller

```typescript
// Before (simulated)
console.log('✓ Simulating reservation creation...');
const reservationId = `ALAKRAN-${Date.now()}`;

// After (real reservation)
const result = await theForkScraper.makeReservation(...);

if (result.success) {
  const reservationId = result.confirmationNumber;
  console.log('✓ Reservation confirmed:', reservationId);
}
```

---

## Error Handling

### Scraper Errors

```typescript
try {
  const result = await theForkScraper.checkAvailability(...);
} catch (error) {
  // Return user-friendly message to Vapi
  return {
    results: [{
      toolCallId: id,
      result: 'Lo siento, hubo un problema al verificar la disponibilidad.'
    }]
  };
}
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Date button not found | Date too far in future | Widget shows max 3 months ahead |
| Date button disabled | Restaurant closed that day | Check restaurant hours |
| No times available | Fully booked | Suggest alternative dates |
| Submit fails | Form validation error | Check required fields |
| Timeout | Slow network | Increase `waitForTimeout` |

---

## Testing

### Unit Test

```bash
npx ts-node test-scraper.ts
```

This will:
1. Test availability check for tomorrow
2. Show available times
3. (Optional) Test reservation creation

### Integration Test

```bash
# Start server
npm run dev

# In another terminal
./test-vapi-actual-request.sh
```

This tests the full flow: Webhook → Controller → Scraper → TheFork

---

## Configuration

### Environment Variables

Add to `.env` if needed:

```env
# TheFork Widget URL (currently hardcoded in scraper)
THEFORK_WIDGET_URL=https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466

# Browser settings
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

### Widget URL

Current URL (hardcoded in `theForkScraper.ts`):
```
https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466
```

To change, update the constant:
```typescript
const THEFORK_WIDGET_URL = 'your-new-url';
```

---

## Performance Considerations

### Browser Instance

- Browser is initialized once and reused
- New page created for each request
- Call `theForkScraper.close()` to cleanup

### Timeouts

- Page load: `waitUntil: 'networkidle'` (waits for network to be idle)
- After clicks: `1000ms` (1 second)
- Form submission: `3000ms` (3 seconds)
- Adjust if experiencing timeouts

### Concurrency

- Each request uses a new page
- Browser supports multiple concurrent pages
- Safe for multiple simultaneous webhook calls

---

## Limitations

1. **Widget Structure**: Scraper depends on TheFork's HTML structure
   - If TheFork updates their widget, selectors may break
   - Solution: Update selectors in scraper

2. **Maximum Guests**: Limited to 40 people (TheFork widget limit)

3. **Date Range**: Widget shows ~3 months ahead
   - Cannot book further than widget allows

4. **Browser Resource**: Uses more resources than API calls
   - Consider rate limiting for high traffic

5. **Email Field**: Currently uses restaurant email
   - Could be enhanced to ask customer for email during call

---

## Maintenance

### Updating Selectors

If TheFork changes their widget structure:

1. Inspect the new HTML structure
2. Update selectors in `theForkScraper.ts`:
   ```typescript
   // Example: Date button selector changed
   const dateSelector = `[data-testid="new-date-selector-${date}"]`;
   ```

3. Test with `test-scraper.ts`
4. Deploy updated code

### Monitoring

Log files to monitor:

```bash
# Watch server logs for scraper activity
tail -f logs/alakran.log | grep "TheFork"
```

Look for:
- `[TheFork] Checking availability...`
- `[TheFork] Found X available times`
- `[TheFork] Error...` (indicates problems)

---

## Future Enhancements

### Potential Improvements

1. **Customer Email Collection**
   - Add email field to Vapi structured data
   - Use customer's email instead of restaurant email

2. **Retry Logic**
   - Retry failed availability checks (network issues)
   - Exponential backoff for transient failures

3. **Caching**
   - Cache available dates/times for X minutes
   - Reduce scraper calls for same date/time

4. **Direct API Integration**
   - Contact TheFork for API access
   - Replace scraper with direct API calls (more reliable)

5. **Monitoring Dashboard**
   - Track success/failure rates
   - Alert on high failure rates
   - Monitor response times

---

## Troubleshooting

### Scraper Not Working

**Symptom**: Availability always returns "not available"

**Debug steps**:
1. Run test script: `npx ts-node test-scraper.ts`
2. Check if date selector is correct
3. Try with headless: false to see browser
4. Check TheFork widget URL is still valid

### Playwright Installation Issues

**Error**: `browserType.launch: Executable doesn't exist`

**Solution**:
```bash
npx playwright install chromium
```

### Permission Errors

**Error**: `Failed to launch chromium because executable doesn't have proper permissions`

**Solution**:
```bash
chmod +x ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome
```

---

## Related Documentation

- [VAPI_INTEGRATION.md](VAPI_INTEGRATION.md) - Vapi webhook setup
- [CRITICAL_FINDINGS.md](CRITICAL_FINDINGS.md) - Known issues and fixes
- [TESTING_SUMMARY.md](TESTING_SUMMARY.md) - Testing guide

---

## Summary

The TheFork scraper provides:
- ✅ Real availability checking from TheFork widget
- ✅ Actual reservation creation
- ✅ Automatic date/time validation
- ✅ Customer information submission
- ✅ Confirmation number extraction

This replaces simulated availability checks with real data from the restaurant's booking system.
