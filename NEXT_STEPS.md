# Next Steps

Your Hacienda Alakran Vapi webhook service is ready! Here's what to do next.

## ⚠️ CRITICAL First: Understand This

**Your service runs on localhost:3000, which Vapi CANNOT access from the internet!**

You need ngrok or production deployment for Vapi to reach your webhooks.

## Immediate Actions (10 minutes)

### 1. Start the Service

```bash
npm run dev
```

You should see:
```
========================================
Hacienda Alakran Vapi Service
========================================
Server running on port 3000
...
```

### 2. Test Locally

In another terminal, run:
```bash
./test-requests.sh
```

Or manually test:
```bash
curl http://localhost:3000/health
```

### 3. Install and Start ngrok (REQUIRED for Vapi)

See [NGROK_SETUP.md](NGROK_SETUP.md) for detailed instructions.

**Quick setup:**

```bash
# Install ngrok (choose one):
# macOS:
brew install ngrok

# Linux:
snap install ngrok

# Or download from https://ngrok.com/download

# Start ngrok in a NEW terminal:
ngrok http 3000
```

**Copy the HTTPS URL** from the output:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              Copy this URL!
```

### 4. Verify ngrok Works

Test your public URL (replace with YOUR ngrok URL):
```bash
curl https://abc123.ngrok-free.app/health
```

You should get the same response as localhost.

### 5. Verify Logs

Check that your terminal shows:
- Incoming requests
- Request body with parameters
- Validation results
- Response data

## Short Term (Same Day)

### 6. Configure Vapi

Follow [VAPI_INTEGRATION.md](VAPI_INTEGRATION.md):

1. Add function tool for `checkAvailabilityALAKRAN`
2. Set webhook URL: `https://YOUR-NGROK-URL.ngrok-free.app/webhooks/check-availability`
3. Configure end-of-call webhook
4. Set webhook URL: `https://YOUR-NGROK-URL.ngrok-free.app/webhooks/reservation-complete`
5. Update assistant instructions

⚠️ **Important**: Use YOUR actual ngrok URL, not localhost!

### 7. Test with Vapi

1. Make a test call to your Vapi number
2. Go through the reservation flow
3. Check your service logs
4. Verify both webhooks were called
5. Confirm data was received correctly

## Medium Term (1 week)

### 8. Review Test Call Results

After your first Vapi test call:
- [ ] Did availability check get called?
- [ ] Were the parameters correct (fecha, hora, personas)?
- [ ] Did Vapi receive the response?
- [ ] Did reservation complete webhook get called?
- [ ] Was all structured data present?
- [ ] Were data types correct?

### 9. Refine Vapi Assistant

Based on test results:
- Adjust assistant instructions
- Improve data extraction prompts
- Handle edge cases
- Test different conversation flows

### 10. Prepare for Restaurant API Integration

Research your restaurant's reservation system:
- Does it have an API?
- What authentication does it use?
- What's the availability check endpoint?
- What's the create reservation endpoint?
- What data format does it expect?

## Long Term (2-4 weeks)

### 11. Integrate Restaurant API

Create a new file: `src/api/restaurant.ts`

```typescript
export const restaurantAPI = {
  async checkAvailability(params: {
    date: string;
    time: string;
    numberOfGuests: number;
  }) {
    // TODO: Implement actual API call
    const response = await fetch('https://restaurant-api.com/availability', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESTAURANT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    return response.json();
  },

  async createReservation(data: ReservationData) {
    // TODO: Implement actual API call
    const response = await fetch('https://restaurant-api.com/reservations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESTAURANT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

Update controllers to use the API:
- Replace simulated responses in [availabilityController.ts](src/controllers/availabilityController.ts)
- Replace simulated responses in [reservationController.ts](src/controllers/reservationController.ts)

### 12. Add Database (Optional)

If you need to store reservations:

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Create schema:
```prisma
model Reservation {
  id              String   @id @default(uuid())
  date            String
  time            String
  people          Int
  fullName        String
  honorific       String
  baby            Boolean
  allergies       String?
  specialRequests String?
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  vapiCallId      String?
}
```

### 13. Production Deployment

- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Enable HTTPS
- [ ] Set webhook secret
- [ ] Configure monitoring
- [ ] Set up error alerting
- [ ] Configure logging aggregation
- [ ] Set up health check monitoring
- [ ] Configure auto-scaling

### 14. Monitoring & Alerting

Add monitoring services:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry, Rollbar)
- Log aggregation (Papertrail, LogDNA)
- Performance monitoring (New Relic, DataDog)

### 15. Additional Features

Consider adding:
- Email confirmation to customers
- SMS confirmation
- Reservation modification webhook
- Cancellation webhook
- Webhook retry logic
- Rate limiting
- Webhook signature verification
- Admin dashboard
- Analytics and reporting

## Troubleshooting Checklist

If things don't work:

- [ ] Is the service running? (`curl http://localhost:3000/health`)
- [ ] Is it publicly accessible? (Test from different network)
- [ ] Are webhook URLs correct in Vapi?
- [ ] Is webhook secret matching?
- [ ] Are request formats correct?
- [ ] Check Vapi call logs
- [ ] Check your service logs
- [ ] Test with curl first
- [ ] Verify JSON is valid
- [ ] Check for CORS issues (shouldn't be needed for webhooks)

## Documentation References

- [README.md](README.md) - Complete documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [TESTING.md](TESTING.md) - Detailed test cases
- [VAPI_INTEGRATION.md](VAPI_INTEGRATION.md) - Vapi configuration
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

## Support Resources

### Vapi Documentation
- Docs: https://docs.vapi.ai
- Function Tools: https://docs.vapi.ai/tools/function
- Structured Data: https://docs.vapi.ai/structured-data

### Your Service
- Check logs for detailed request/response data
- All requests are logged automatically
- Validation errors show exact issues

## Success Metrics

Track these to measure success:
- Number of calls handled per day
- Availability check success rate
- Reservation completion rate
- Average response time
- Error rate
- Customer satisfaction (ask restaurant)

## Regular Maintenance

Weekly:
- Review error logs
- Check response times
- Monitor success rates
- Review unusual patterns

Monthly:
- Update dependencies (`npm update`)
- Review and improve assistant instructions
- Analyze reservation patterns
- Optimize performance

## Get Help

If you need assistance:
1. Check service logs first
2. Review documentation files
3. Test with curl to isolate issues
4. Check Vapi dashboard for call logs
5. Verify request/response formats

## Current Status

✅ Service created
✅ TypeScript configured
✅ Validation implemented
✅ Logging configured
✅ Documentation complete
✅ Test scripts ready
⏳ Pending: Vapi configuration
⏳ Pending: Public deployment
⏳ Pending: Restaurant API integration

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
./test-requests.sh

# Check health
curl http://localhost:3000/health

# Test availability webhook
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d @test-availability.json

# Test reservation webhook
curl -X POST http://localhost:3000/webhooks/reservation-complete \
  -H "Content-Type: application/json" \
  -d @test-reservation.json
```

---

**You're all set!** Start with the immediate actions and work your way through the list. Good luck! 🎉
