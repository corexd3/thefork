# Quick Reference Card

## ⚠️ Most Important Thing to Remember

**Vapi CANNOT access localhost:3000!**

You MUST use ngrok or deploy to production for Vapi to reach your webhooks.

## Setup (One Time)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Install ngrok
brew install ngrok    # macOS
snap install ngrok    # Linux
# Or download from https://ngrok.com/download
```

## Every Development Session

### Terminal 1: Your Service
```bash
npm run dev
```

### Terminal 2: ngrok Tunnel
```bash
ngrok http 3000
```

**→ Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Terminal 3: Testing (Optional)
```bash
./test-requests.sh
```

## Vapi Configuration URLs

Use your ngrok URL in Vapi dashboard:

**Availability Check:**
```
https://YOUR-NGROK-URL.ngrok-free.app/webhooks/check-availability
```

**Reservation Complete:**
```
https://YOUR-NGROK-URL.ngrok-free.app/webhooks/reservation-complete
```

⚠️ **Replace YOUR-NGROK-URL with your actual ngrok URL!**

## Test Commands

### Local Testing
```bash
# Health check
curl http://localhost:3000/health

# Quick test - All webhooks (recommended)
./test-all-webhooks.sh

# Individual webhook tests
./test-vapi-actual-request.sh        # Availability check with real Vapi format
./test-vapi-reservation-complete.sh  # Reservation complete with real Vapi format

# Legacy test (simple format)
./test-requests.sh
```

### Public URL Testing (with ngrok)
```bash
# Health check (replace URL)
curl https://YOUR-URL.ngrok-free.app/health

# Monitor requests
open http://127.0.0.1:4040
```

## Project Structure

```
src/
├── controllers/
│   ├── availabilityController.ts    ← Check availability logic
│   └── reservationController.ts     ← Reservation completion logic
├── middleware/
│   ├── logger.ts                    ← Request/response logging
│   └── validator.ts                 ← Zod validation
├── routes/
│   └── webhooks.ts                  ← Route definitions
└── types/
    └── vapi.ts                      ← TypeScript types
```

## Endpoints

- `GET  /health` - Health check
- `POST /webhooks/check-availability` - Availability check (during call)
- `POST /webhooks/reservation-complete` - Reservation data (after call)

## Logs to Watch For

When Vapi calls your webhooks, you'll see:

```
========================================
[timestamp] POST /webhooks/check-availability
Headers: {...}
Body: {
  "message": {
    "type": "function-call",
    "functionCall": {
      "parameters": {
        "hora": "13:00",
        "fecha": "2025-09-03",
        "personas": 4
      }
    }
  }
}
========================================

=== Check Availability Request ===
Received parameters:
- Fecha (Date): 2025-09-03
- Hora (Time): 13:00
- Personas (People): 4
✓ Data validation passed
```

## Common Issues

### "webhook timeout" in Vapi
- ❌ Using localhost URL
- ✅ Use ngrok URL

### "Connection refused"
- Is your service running? (`npm run dev`)
- Is ngrok running? (`ngrok http 3000`)

### "Invalid request data"
- Check Vapi logs for request format
- Check your service logs for validation errors
- Verify parameter names match exactly

### ngrok URL changed
- Free ngrok changes URL on restart
- Update Vapi with new URL
- Or use paid ngrok for persistent URL

## Documentation Files

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup
- [NGROK_SETUP.md](NGROK_SETUP.md) - Detailed ngrok guide
- [VAPI_INTEGRATION.md](VAPI_INTEGRATION.md) - Vapi configuration
- [TESTING.md](TESTING.md) - Test scenarios
- [NEXT_STEPS.md](NEXT_STEPS.md) - What to do next

## Next Steps After Setup

1. ✅ Start service (`npm run dev`)
2. ✅ Start ngrok (`ngrok http 3000`)
3. ✅ Test locally (`curl http://localhost:3000/health`)
4. ✅ Test public URL (`curl https://YOUR-URL.ngrok-free.app/health`)
5. ⏳ Configure Vapi with ngrok URLs
6. ⏳ Test with Vapi phone call
7. ⏳ Integrate restaurant API
8. ⏳ Deploy to production

## Production Deployment

When ready for production:
- Deploy to Railway, Render, Heroku, etc.
- Get permanent HTTPS URL
- Update Vapi with production URL
- No more ngrok needed!

## Environment Variables

```env
PORT=3000                          # Server port
NODE_ENV=development               # Environment
VAPI_API_KEY=your_key             # Optional
WEBHOOK_SECRET=your_secret        # Optional security
```

## File API Integration

When restaurant API is ready, update:

1. [src/controllers/availabilityController.ts](src/controllers/availabilityController.ts) - Line ~30
2. [src/controllers/reservationController.ts](src/controllers/reservationController.ts) - Line ~40

Look for `// TODO:` comments in the code.

## Support

- Vapi docs: https://docs.vapi.ai
- ngrok docs: https://ngrok.com/docs
- Project issues: Check logs first!

---

**Keep this handy while developing!** 📌
