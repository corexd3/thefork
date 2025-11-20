# Quick Start Guide

Get the Hacienda Alakran Vapi webhook service running in under 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development):
```env
PORT=3000
NODE_ENV=development
```

## 3. Start the Server

### Development mode (recommended for testing):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## 4. Verify It's Running

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "Hacienda Alakran Vapi Service",
  "timestamp": "2025-11-19T15:41:00.000Z"
}
```

## 5. Expose Your Service to the Internet (Required for Vapi)

⚠️ **IMPORTANT**: Vapi servers cannot access `localhost:3000` from the internet. You must expose your service using ngrok or deploy it.

### Option A: Use ngrok (Recommended for Testing)

1. Install ngrok:
   - Download from https://ngrok.com/download
   - Or use: `brew install ngrok` (macOS) or `snap install ngrok` (Linux)

2. Start ngrok in a new terminal:
```bash
ngrok http 3000
```

3. Copy the HTTPS URL shown (e.g., `https://abc123.ngrok-free.app`)

4. **Use this URL in Vapi dashboard** instead of localhost:
   - Availability webhook: `https://abc123.ngrok-free.app/webhooks/check-availability`
   - Reservation webhook: `https://abc123.ngrok-free.app/webhooks/reservation-complete`

### Option B: Deploy to Production

Deploy to a hosting platform:
- Railway, Render, Heroku, DigitalOcean, AWS, etc.
- Use the production HTTPS URL in Vapi

## 6. Test Locally (Before Vapi Integration)

### Test Availability Check:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "test-123",
        "parameters": {
          "hora": "13:00",
          "fecha": "2025-09-03",
          "personas": 4
        }
      }
    }
  }'
```

### Test Reservation Complete:

```bash
curl -X POST http://localhost:3000/webhooks/reservation-complete \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "structuredData": {
        "reservation": {
          "date": "2025-09-03",
          "time": "13:00",
          "people": 4,
          "full_name": "Juan Pérez",
          "honorific": "Sr.",
          "baby": false,
          "allergies": "gluten",
          "special_requests": "mesa junto a la ventana"
        }
      }
    }
  }'
```

## 7. Check the Logs

Watch your server terminal - you should see detailed logs of:
- Incoming requests
- Parameter validation
- Simulated responses
- Response data

## What's Next?

1. **Expose your service** using ngrok (see step 5 above)
2. **Configure Vapi**: Update your Vapi dashboard with the ngrok HTTPS URLs
3. **Test with Vapi**: Make a test call through Vapi
4. **Integrate API**: Replace simulated responses with real restaurant API
5. **Deploy**: Deploy to production hosting (see README.md)

## Available Endpoints

Once running, your service provides:

- `GET /` - Service information
- `GET /health` - Health check
- `POST /webhooks/check-availability` - Check restaurant availability
- `POST /webhooks/reservation-complete` - Handle completed reservations

## Troubleshooting

### Port Already in Use?
Change the PORT in `.env` to something else (e.g., 3001)

### Dependencies Failed to Install?
Make sure you have Node.js 18+ installed:
```bash
node --version
```

### Webhook Not Working?
1. Check the server is running (`curl http://localhost:3000/health`)
2. Verify request format matches examples above
3. Check server logs for validation errors

## Need Help?

See the full documentation:
- [README.md](README.md) - Complete documentation
- [TESTING.md](TESTING.md) - Detailed testing guide
