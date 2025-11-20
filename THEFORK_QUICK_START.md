# TheFork Scraper - Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Test the Scraper
```bash
npm run test:scraper
```

This will:
- ✓ Check availability for tomorrow
- ✓ Show all available times
- ✓ Verify scraper is working

---

## 📋 What Changed

### Before (Simulated)
```typescript
// Availability always returned "yes"
const message = `Perfecto, tenemos disponibilidad...`;
return message;
```

### After (Real Data)
```typescript
// Checks actual TheFork widget
const availability = await theForkScraper.checkAvailability(date, time, people);

if (availability.available) {
  return "Sí, tenemos disponibilidad";
} else {
  return "No, pero tenemos: " + otherTimes;
}
```

---

## 🔧 How to Use

### Check Availability (Automatic)

When Vapi calls `checkAvailabilityALAKRAN`, the scraper automatically:

1. Opens TheFork widget (headless browser)
2. Clicks the date button
3. Selects number of people
4. Gets all available times
5. Returns result to Vapi

**No manual action needed** - it happens automatically during calls!

### Make Reservation (Automatic)

When call ends with complete reservation data:

1. Scraper opens TheFork widget
2. Selects date, time, people
3. Fills customer information
4. Submits reservation
5. Returns confirmation number

**Also automatic** - happens at end of successful calls!

---

## 📊 Server Logs

Watch scraper activity:

```bash
# In terminal running npm run dev
[TheFork] Checking availability for 2025-11-27 at 20:00 for 4 people
[TheFork] Clicked date: 2025-11-27
[TheFork] Selected 4 people
[TheFork] Found 8 available times: 19:00, 19:30, 20:00, ...
✓ Availability check completed
```

---

## 🧪 Manual Testing

### Test Availability Only
```bash
npm run test:scraper
```

### Test Full Webhook Flow
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test availability webhook
./test-vapi-actual-request.sh

# Terminal 3: Test reservation webhook
./test-vapi-reservation-complete.sh
```

---

## ⚙️ Configuration

### Widget URL

Located in `src/services/theForkScraper.ts`:

```typescript
const THEFORK_WIDGET_URL = 'https://widget.thefork.com/en-GB/2ed2c147-011b-4981-b971-1d4718072466';
```

Change this if widget URL changes.

### Browser Settings

```typescript
{
  headless: true,  // No visible browser window
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}
```

Set `headless: false` to see browser during debugging.

---

## 🐛 Troubleshooting

### Scraper Not Finding Dates

**Problem**: "Date not available" even when it should be

**Solution**:
1. Check widget URL is correct
2. Verify date format: `YYYY-MM-DD`
3. Check date is not more than 3 months ahead
4. Test manually: Run `npm run test:scraper`

### Chromium Not Found

**Problem**: `Executable doesn't exist at ...`

**Solution**:
```bash
npx playwright install chromium
```

### Timeouts

**Problem**: Scraper times out frequently

**Solution**: Increase timeouts in `theForkScraper.ts`:
```typescript
await page.waitForTimeout(2000); // Increase from 1000 to 2000
```

---

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Check Availability | ~5-8 seconds | Opens browser, navigates, extracts times |
| Make Reservation | ~10-15 seconds | Full flow including form submission |
| Browser Startup | ~2 seconds | First request only, then reused |

**Concurrent Requests**: Supported - each request uses a new page in the same browser.

---

## ✅ Production Checklist

Before deploying:

- [ ] Test scraper: `npm run test:scraper`
- [ ] Verify widget URL is correct
- [ ] Test with actual Vapi call
- [ ] Check logs for errors
- [ ] Ensure Chromium is installed on server
- [ ] Set `headless: true` in production
- [ ] Monitor initial calls for issues

---

## 🔗 Full Documentation

For detailed information, see [THEFORK_SCRAPER.md](THEFORK_SCRAPER.md).

---

## 💡 Key Points

1. **Automatic**: Scraper runs automatically when Vapi calls webhooks
2. **Real Data**: Uses actual TheFork widget, not simulated responses
3. **No API Key**: Uses web scraping, no TheFork API needed
4. **Concurrent**: Handles multiple requests simultaneously
5. **Robust**: Returns helpful error messages if something fails

---

## 🎯 Next Steps

1. Test locally: `npm run test:scraper`
2. Update Vapi dashboard URLs (if needed)
3. Make a test Vapi call
4. Monitor logs during test call
5. Verify reservations appear in TheFork

That's it! The scraper is fully integrated and ready to use.
