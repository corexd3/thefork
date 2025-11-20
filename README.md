# Hacienda Alakran Vapi Webhook Service

A Node.js/TypeScript service for handling Vapi webhooks for the Hacienda Alakran restaurant reservation system.

## Overview

This service provides two webhook endpoints that integrate with Vapi for automated phone reservations:

1. **Check Availability Webhook** - Called during conversations to check restaurant availability
2. **Reservation Complete Webhook** - Called when a reservation conversation completes successfully

## Features

- TypeScript for type safety
- Zod schema validation for webhook payloads
- Request/Response logging for debugging
- Optional webhook secret authentication
- Health check endpoint
- Ready for restaurant API integration

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file (optional - see [VAPI_CONCEPTS.md](VAPI_CONCEPTS.md)):
```env
PORT=3000
NODE_ENV=development

# Optional: Only needed if making API calls TO Vapi (not required for webhooks)
# VAPI_API_KEY=your_vapi_private_key_here

# Optional: For webhook security (recommended for production)
WEBHOOK_SECRET=your_webhook_secret_here
```

**Note**: For webhooks that only RECEIVE data from Vapi, you don't need a Vapi API key!

## Running the Service

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

The service will start on `http://localhost:3000` (or your configured PORT).

## ⚠️ CRITICAL: Making Your Service Accessible to Vapi

**localhost:3000 is NOT accessible from the internet!**

Vapi's servers cannot reach your local machine. You MUST expose your service using one of these methods:

### Option 1: ngrok (Recommended for Development/Testing)

See [NGROK_SETUP.md](NGROK_SETUP.md) for detailed instructions.

Quick start:
```bash
# Terminal 1: Start your service
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) and use it in Vapi.

### Option 2: Deploy to Production

Deploy to a hosting platform for a permanent URL:
- Railway, Render, Heroku, DigitalOcean, AWS, etc.

See "Deployment" section below.

## API Endpoints

### Health Check
```
GET /health
```

Returns the service health status.

### Check Availability Webhook
```
POST /webhooks/check-availability
```

Called by Vapi when the `checkAvailabilityALAKRAN` function is invoked during a conversation.

**Request Body:**
```json
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "name": "checkAvailabilityALAKRAN",
      "parameters": {
        "hora": "13:00",
        "fecha": "2025-09-03",
        "personas": 4
      }
    }
  }
}
```

**Response:**
```json
{
  "results": [{
    "toolCallId": "string",
    "result": "Perfecto, tenemos disponibilidad para 4 personas el 2025-09-03 a las 13:00..."
  }]
}
```

### Reservation Complete Webhook
```
POST /webhooks/reservation-complete
```

Called by Vapi at the end of a successful reservation conversation with structured data.

**Request Body:**
```json
{
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
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reservation received successfully",
  "data": {
    "reservationId": "ALAKRAN-1234567890",
    "customer": "Sr. Juan Pérez",
    "dateTime": "2025-09-03 at 13:00",
    "guestCount": 4,
    "hasBaby": false,
    "allergies": "gluten",
    "specialRequests": "mesa junto a la ventana",
    "status": "pending_confirmation",
    "createdAt": "2025-11-19T15:08:00.000Z"
  }
}
```

## Vapi Configuration

### Function Tool Configuration (Check Availability)

In your Vapi dashboard, configure the function tool:

**Server URL:**
```
https://your-domain.com/webhooks/check-availability
```

**Function Schema:**
```json
{
  "name": "checkAvailabilityALAKRAN",
  "description": "Check restaurant availability for a specific date, time, and number of guests",
  "parameters": {
    "type": "object",
    "properties": {
      "hora": {
        "description": "la hora de la reserva. por ejemplo \"la una de la tarde\" son las \"13:00\".",
        "type": "string",
        "default": ""
      },
      "fecha": {
        "description": "La fecha donde el usuario quiere hacer la reserva. Por ejemplo el 3 de septiembre de 2025 se enviará como \"2025-09-03\".",
        "type": "string",
        "default": ""
      },
      "personas": {
        "description": "numero de personas que atenderan a la reserva.",
        "type": "number",
        "default": ""
      }
    },
    "required": ["hora", "fecha", "personas"]
  }
}
```

### End of Call Report Configuration (Reservation Complete)

In your Vapi assistant settings, configure the structured data:

**Server URL:**
```
https://your-domain.com/webhooks/reservation-complete
```

**Structured Data Schema:**
```json
{
  "reservation": {
    "date": "string",
    "time": "string",
    "people": "number",
    "full_name": "string",
    "honorific": "string",
    "baby": "boolean",
    "allergies": "string",
    "special_requests": "string"
  }
}
```

## Project Structure

```
alakran/
├── src/
│   ├── controllers/
│   │   ├── availabilityController.ts    # Check availability logic
│   │   └── reservationController.ts     # Reservation completion logic
│   ├── middleware/
│   │   ├── logger.ts                    # Request/response logging
│   │   └── validator.ts                 # Request validation & auth
│   ├── routes/
│   │   └── webhooks.ts                  # Webhook route definitions
│   ├── types/
│   │   └── vapi.ts                      # TypeScript types & Zod schemas
│   └── index.ts                         # Express app setup
├── .env.example                         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Integration with Restaurant API

Currently, the service logs and validates incoming data but does not persist reservations. To integrate with your restaurant's reservation system:

1. Update `src/controllers/availabilityController.ts`:
   - Replace the simulated availability check with actual API call
   - Import your restaurant API client
   - Call the API in the `checkAvailability` function

2. Update `src/controllers/reservationController.ts`:
   - Replace the simulated reservation creation with actual API call
   - Import your restaurant API client
   - Call the API in the `completeReservation` function

Example:
```typescript
// In availabilityController.ts
import { restaurantAPI } from './api/restaurant';

const availability = await restaurantAPI.checkAvailability({
  date: params.fecha,
  time: params.hora,
  numberOfGuests: params.personas
});
```

## Testing

You can test the webhooks using curl:

### Test Check Availability:
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

## Security

- The service includes optional webhook secret authentication
- Set `WEBHOOK_SECRET` in your `.env` file
- Vapi will need to send this secret in the `X-Webhook-Secret` header or as a Bearer token

## Logging

All webhook requests and responses are logged to the console for debugging purposes. Check the logs to verify:
- Incoming webhook data format
- Validation results
- Simulated API responses

## Deployment

For production deployment:

1. Build the TypeScript code:
```bash
npm run build
```

2. Set production environment variables

3. Deploy to your preferred hosting platform (AWS, Heroku, Railway, etc.)

4. Update Vapi webhook URLs to point to your production domain

5. Ensure your server is accessible from Vapi's servers

## License

MIT
