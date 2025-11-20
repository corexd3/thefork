# Vapi Integration Guide

Step-by-step instructions for integrating the Hacienda Alakran webhook service with Vapi.

## Prerequisites

- Your webhook service must be deployed and accessible from the internet
- You need a Vapi account with an assistant configured
- Your webhook URL should use HTTPS in production

## Step 1: Deploy Your Webhook Service

⚠️ **CRITICAL**: Vapi's servers are on the internet and **CANNOT access localhost:3000**. You MUST make your service publicly accessible.

Before configuring Vapi, expose your service to a publicly accessible URL:

### Option A: Use ngrok for Testing (Recommended for Development)

1. **Start your service:**
```bash
npm run dev
```

2. **In a NEW terminal, start ngrok:**
```bash
ngrok http 3000
```

3. **Copy the HTTPS URL** from ngrok output:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy `https://abc123.ngrok-free.app` (your URL will be different)

⚠️ **Note**: Free ngrok URLs change each time you restart ngrok. For persistent URLs, use a paid ngrok account or deploy to production.

### Option B: Production Deployment

Deploy to:
- AWS Lambda + API Gateway
- Heroku
- Railway
- DigitalOcean
- Vercel
- Any Node.js hosting platform

Make sure your production URL uses HTTPS.

## Step 2: Configure Check Availability Function Tool

1. **Go to Vapi Dashboard** → Your Assistant → Tools

2. **Add Function Tool** with these settings:

   **Name:** `checkAvailabilityALAKRAN`

   **Server URL:** (Use your ngrok URL or production domain)
   ```
   https://abc123.ngrok-free.app/webhooks/check-availability
   ```

   ⚠️ Replace `abc123.ngrok-free.app` with YOUR actual ngrok URL or production domain!

   **HTTP Method:** POST

   **Description:**
   ```
   Check restaurant availability for a specific date, time, and number of guests at Hacienda Alakran
   ```

   **Parameters Schema:**
   ```json
   {
     "type": "object",
     "properties": {
       "hora": {
         "description": "la hora de la reserva. por ejemplo \"la una de la tarde\" son las \"13:00\".",
         "type": "string"
       },
       "fecha": {
         "description": "La fecha donde el usuario quiere hacer la reserva. Por ejemplo el 3 de septiembre de 2025 se enviará como \"2025-09-03\".",
         "type": "string"
       },
       "personas": {
         "description": "numero de personas que atenderan a la reserva.",
         "type": "number"
       }
     },
     "required": ["hora", "fecha", "personas"]
   }
   ```

   **Headers (if using webhook secret):**
   ```json
   {
     "X-Webhook-Secret": "your_webhook_secret_here"
   }
   ```

3. **Save** the function tool configuration

## Step 3: Update Assistant Instructions

Update your Vapi assistant's system prompt to use the function:

```
You are a reservation assistant for Hacienda Alakran restaurant.

When the customer wants to make a reservation:
1. Collect the date, time, and number of guests
2. Call the checkAvailabilityALAKRAN function to check availability
3. Based on the response, continue with the reservation or offer alternatives
4. Collect customer details: full name, honorific, whether they have a baby
5. Ask about allergies and special requests
6. Confirm all details with the customer

Always be polite and professional. Speak in Spanish.
```

## Step 4: Configure End-of-Call Webhook

1. **Go to Vapi Dashboard** → Your Assistant → End of Call Report

2. **Enable Structured Data Collection**

3. **Configure Webhook:**

   **Webhook URL:** (Use your ngrok URL or production domain)
   ```
   https://abc123.ngrok-free.app/webhooks/reservation-complete
   ```

   ⚠️ Replace `abc123.ngrok-free.app` with YOUR actual ngrok URL or production domain!

   **HTTP Method:** POST

   **Headers (if using webhook secret):**
   ```json
   {
     "X-Webhook-Secret": "your_webhook_secret_here"
   }
   ```

4. **Define Structured Data Schema:**

   ```json
   {
     "reservation": {
       "date": {
         "type": "string",
         "description": "Reservation date in YYYY-MM-DD format"
       },
       "time": {
         "type": "string",
         "description": "Reservation time in HH:MM format"
       },
       "people": {
         "type": "number",
         "description": "Number of guests"
       },
       "full_name": {
         "type": "string",
         "description": "Customer's full name"
       },
       "honorific": {
         "type": "string",
         "description": "Customer's title (Sr., Sra., Don, Doña, etc.)"
       },
       "baby": {
         "type": "boolean",
         "description": "Whether customer will bring a baby"
       },
       "allergies": {
         "type": "string",
         "description": "Any food allergies"
       },
       "special_requests": {
         "type": "string",
         "description": "Any special requests"
       }
     }
   }
   ```

5. **Update Assistant Instructions** to collect this data:

   ```
   At the end of the successful reservation, make sure you have collected:
   - reservation.date
   - reservation.time
   - reservation.people
   - reservation.full_name
   - reservation.honorific
   - reservation.baby
   - reservation.allergies
   - reservation.special_requests
   ```

## Step 5: Test the Integration

### Test Call Flow:

1. **Initiate a test call** to your Vapi assistant

2. **Follow the reservation flow:**
   - "Hola, quiero hacer una reserva"
   - Provide date: "para el 3 de septiembre"
   - Provide time: "a las una de la tarde"
   - Provide number of guests: "somos 4 personas"

3. **Check your webhook logs** - you should see:
   - POST to `/webhooks/check-availability`
   - Parameters: fecha, hora, personas
   - Response back to Vapi

4. **Complete the reservation:**
   - Provide name: "Juan Pérez"
   - Confirm honorific: "Señor"
   - Indicate baby: "no"
   - Provide allergies: "soy alérgico al gluten"
   - Special requests: "mesa junto a la ventana"

5. **After call ends**, check logs for:
   - POST to `/webhooks/reservation-complete`
   - All structured data received
   - Reservation summary logged

## Step 6: Monitor and Debug

### Check Vapi Logs:
1. Go to Vapi Dashboard → Calls
2. Find your test call
3. Check function call logs
4. Verify end-of-call report was sent

### Check Your Service Logs:
```bash
# If using local development
npm run dev

# If using production
# Check your hosting platform's logs
```

Look for:
- Request headers and body
- Validation results
- Response data
- Any errors

## Webhook Request Format Examples

### What Vapi Sends for Availability Check:

```json
{
  "message": {
    "type": "function-call",
    "call": { ... },
    "functionCall": {
      "id": "fc_abc123",
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

### What Your Service Should Return:

```json
{
  "results": [{
    "toolCallId": "fc_abc123",
    "result": "Perfecto, tenemos disponibilidad para 4 personas el 2025-09-03 a las 13:00. ¿Desea confirmar la reserva?"
  }]
}
```

### What Vapi Sends for Reservation Complete:

```json
{
  "message": {
    "type": "end-of-call-report",
    "call": { ... },
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

## Security Best Practices

1. **Use HTTPS** in production
2. **Set webhook secret** in both Vapi and your `.env` file
3. **Validate all inputs** (already implemented)
4. **Rate limiting** (add if needed)
5. **Monitor for errors** and unusual activity

## Common Issues

### Webhook Times Out
- Check if your service is accessible from internet
- Verify no firewall blocking Vapi's servers
- Ensure response time is under 10 seconds

### Function Not Called
- Verify function name matches exactly: `checkAvailabilityALAKRAN`
- Check assistant instructions prompt the function call
- Review Vapi call logs for errors

### Structured Data Not Received
- Ensure end-of-call report is enabled
- Verify webhook URL is correct
- Check that assistant collects all required fields
- Review Vapi call transcript

### Invalid Request Errors
- Check request format matches expected schema
- Verify Content-Type is `application/json`
- Check webhook secret if configured
- Review service logs for validation errors

## Testing Checklist

- [ ] Service deployed and accessible
- [ ] Health check endpoint works
- [ ] Function tool configured in Vapi
- [ ] End-of-call webhook configured
- [ ] Test call successfully checks availability
- [ ] Test call successfully completes reservation
- [ ] All data logged correctly
- [ ] No errors in logs
- [ ] Response time acceptable

## Next Steps

Once integration is complete:

1. **Test thoroughly** with various scenarios
2. **Integrate restaurant API** (replace simulated responses)
3. **Add database** for persistence if needed
4. **Set up monitoring** and alerting
5. **Configure production environment**
6. **Train staff** on handling automated reservations

## Support

For Vapi-specific issues:
- Vapi Documentation: https://docs.vapi.ai
- Vapi Support: support@vapi.ai

For webhook service issues:
- Check service logs
- Review TESTING.md for test cases
- Verify request/response formats
