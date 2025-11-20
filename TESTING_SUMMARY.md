# Testing Summary

## 🎯 Available Test Scripts

You now have **4 test scripts** to validate your webhooks:

### 1. **test-all-webhooks.sh** (Recommended)
Comprehensive test that checks all endpoints with actual Vapi formats.

```bash
./test-all-webhooks.sh
```

**Tests:**
- ✓ Health check
- ✓ Availability check webhook (with real Vapi payload)
- ✓ Reservation complete webhook (with real Vapi payload)

**Output:** Color-coded results showing pass/fail for each test

---

### 2. **test-vapi-actual-request.sh**
Tests the availability check webhook with the exact format Vapi sends.

```bash
./test-vapi-actual-request.sh
```

**Tests:**
- Availability check with full Vapi metadata (call info, timestamps, etc.)

**Use when:** You want to test just the availability endpoint with real format

---

### 3. **test-vapi-reservation-complete.sh**
Tests the reservation complete webhook with the exact format Vapi sends.

```bash
./test-vapi-reservation-complete.sh
```

**Tests:**
- Reservation completion with full Vapi end-of-call report format

**Use when:** You want to test just the reservation endpoint with real format

---

### 4. **test-requests.sh** (Legacy)
Original simple test with minimal payload format.

```bash
./test-requests.sh
```

**Tests:**
- Basic availability and reservation tests
- Simpler format (not full Vapi format)

**Use when:** Quick basic validation

---

## 🚀 Quick Start Testing

### Before Vapi Integration (Local Testing)

**Step 1:** Start your service
```bash
npm run dev
```

**Step 2:** Run comprehensive tests
```bash
./test-all-webhooks.sh
```

**Expected output:**
```
========================================
Testing All Vapi Webhooks
========================================

1. Testing Health Check...
✓ Health check passed

2. Testing Check Availability Webhook...
   (Simulating Vapi function call)
✓ Availability check webhook passed
   Response: Perfecto, tenemos disponibilidad para 4 personas el 2025-11-27 a las 20:00...

3. Testing Reservation Complete Webhook...
   (Simulating Vapi end-of-call report)
✓ Reservation complete webhook passed
   Reservation ID: ALAKRAN-1234567890
   Customer: Sr. Juan Pérez García

========================================
Test Summary
========================================

All tests completed!
```

---

## 🔧 Testing with Vapi

### Step 1: Expose Service with ngrok

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
ngrok http 3000
```

Copy the HTTPS URL: `https://abc123.ngrok-free.app`

### Step 2: Update Vapi Dashboard

Configure both webhooks with your ngrok URL:
1. `https://abc123.ngrok-free.app/webhooks/check-availability`
2. `https://abc123.ngrok-free.app/webhooks/reservation-complete`

### Step 3: Test with Real Call

Make a test call to your Vapi number and:
1. Request a reservation
2. Go through the full flow
3. Watch Terminal 1 for incoming requests

**Expected logs:**
```
========================================
[timestamp] POST /webhooks/check-availability
Headers: {...}
Body: {...}
========================================

=== Check Availability Request ===
Received parameters:
- Fecha (Date): 2025-11-27
- Hora (Time): 20:00
- Personas (People): 4
✓ Data validation passed
✓ Simulating availability check...
Responding with: Perfecto, tenemos disponibilidad...
```

### Step 4: Verify in Vapi Dashboard

After the call:
1. Go to Vapi Dashboard → Calls
2. Find your test call
3. Check function call logs
4. Verify response was received

---

## 📋 Test Checklist

Before deploying to production:

**Local Tests:**
- [ ] `./test-all-webhooks.sh` passes all tests
- [ ] Health check returns 200
- [ ] Availability webhook returns proper format
- [ ] Reservation webhook returns proper format
- [ ] Service logs show no errors

**ngrok Tests:**
- [ ] ngrok is running and accessible
- [ ] Health check works via ngrok URL
- [ ] Can test webhooks via ngrok URL
- [ ] ngrok dashboard shows incoming requests

**Vapi Integration Tests:**
- [ ] Vapi dashboard configured with ngrok URLs
- [ ] Test call successfully triggers availability check
- [ ] Assistant speaks the availability response
- [ ] End-of-call webhook receives reservation data
- [ ] All reservation fields are populated correctly

**Error Handling Tests:**
- [ ] Invalid date format is rejected
- [ ] Invalid time format is rejected
- [ ] Invalid number of people is rejected
- [ ] Missing required fields are caught
- [ ] Service returns appropriate error messages

---

## 🐛 Troubleshooting Tests

### Test fails with "Connection refused"
**Problem:** Service is not running
**Solution:**
```bash
npm run dev
```

### Test fails with validation errors
**Problem:** Request format doesn't match schema
**Check:** Are you using the updated schema with `.passthrough()`?
**Solution:** Make sure you ran `npm run build` after the schema fix

### Vapi shows "No result returned"
**Problem:** Vapi can't reach your service
**Solutions:**
1. Check ngrok is running
2. Verify ngrok URL in Vapi matches current session
3. Test ngrok URL directly: `curl https://YOUR-URL.ngrok-free.app/health`
4. Check service logs for incoming requests

### Test passes locally but fails with Vapi
**Problem:** Usually ngrok URL or network issue
**Solutions:**
1. Restart ngrok and update URL in Vapi
2. Check ngrok dashboard (http://127.0.0.1:4040) for requests
3. Verify no firewall blocking requests
4. Check service logs when Vapi calls

---

## 📊 Understanding Test Outputs

### Successful Availability Check Response:
```json
{
  "results": [{
    "toolCallId": "call_...",
    "result": "Perfecto, tenemos disponibilidad para 4 personas el 2025-11-27 a las 20:00. ¿Desea confirmar la reserva?"
  }]
}
```

### Successful Reservation Complete Response:
```json
{
  "success": true,
  "message": "Reservation received successfully",
  "data": {
    "reservationId": "ALAKRAN-1234567890",
    "customer": "Sr. Juan Pérez García",
    "dateTime": "2025-11-27 at 20:00",
    "guestCount": 4,
    "hasBaby": false,
    "allergies": "gluten, lactosa",
    "specialRequests": "mesa junto a la ventana",
    "status": "pending_confirmation",
    "createdAt": "2025-11-20T15:41:00.000Z"
  }
}
```

### Error Response (Validation Failed):
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["message", "functionCall", "parameters", "hora"],
      "message": "Expected string, received number"
    }
  ]
}
```

---

## 🎓 Test Best Practices

1. **Always test locally first** before testing with Vapi
2. **Run `test-all-webhooks.sh`** after any code changes
3. **Check service logs** for detailed debugging info
4. **Keep ngrok running** during testing sessions
5. **Update Vapi URLs** when ngrok restarts (free tier)
6. **Monitor ngrok dashboard** (http://127.0.0.1:4040) during Vapi tests
7. **Save test call logs** from Vapi for debugging

---

## 📖 Related Documentation

- [TESTING.md](TESTING.md) - Detailed test scenarios and edge cases
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheatsheet
- [NGROK_SETUP.md](NGROK_SETUP.md) - ngrok troubleshooting
- [VAPI_INTEGRATION.md](VAPI_INTEGRATION.md) - Vapi configuration guide

---

## ✅ Success Criteria

Your webhooks are working correctly when:

- ✅ All local tests pass
- ✅ ngrok URL is accessible from internet
- ✅ Vapi calls trigger your webhooks
- ✅ Service logs show incoming requests
- ✅ Vapi receives responses within timeout
- ✅ Assistant speaks the availability message
- ✅ Reservation data is received completely
- ✅ No "No result returned" errors in Vapi logs

**You're all set when you see this in Vapi call logs:**
```json
{
  "role": "tool_call_result",
  "name": "checkAvailabilityALAKRAN",
  "result": "Perfecto, tenemos disponibilidad...",
  "toolCallId": "call_..."
}
```

Instead of:
```json
{
  "result": "No result returned. If this is unexpected..."
}
```
