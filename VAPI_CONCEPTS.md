# Vapi Concepts Explained

## Understanding Vapi Keys and IDs

### API Keys

Vapi provides two types of keys:

#### 1. Public Key
- **Location**: Vapi Dashboard → Account → API Keys → Public Key
- **Purpose**: Used in client-side applications (web browsers, mobile apps)
- **Security**: Safe to expose publicly
- **Use case**: Starting phone calls from your website
- **Not needed for this webhook service**

#### 2. Private Key
- **Location**: Vapi Dashboard → Account → API Keys → Private Key
- **Purpose**: Used in server-side applications
- **Security**: KEEP SECRET! Never expose in client code
- **Use case**: Making API calls TO Vapi programmatically
- **Examples**:
  - Creating/updating assistants via API
  - Starting calls programmatically
  - Querying call data
  - Managing phone numbers

### Do You Need a Vapi API Key for Webhooks?

**NO!** For a webhook service that only RECEIVES data from Vapi, you don't need any Vapi API key.

```
┌──────────────────────────────────────────────────────────┐
│                 Two-Way Communication                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Your Service → Vapi   (Requires Private API Key)       │
│  (Making API calls)                                       │
│                                                           │
│  Vapi → Your Service   (No API Key Needed)              │
│  (Webhooks)            ✓ This is what we're doing        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### When You WOULD Need the Private API Key

Only if you want to do things like:

```typescript
// Example: Making API calls TO Vapi (requires private key)
import axios from 'axios';

const vapiPrivateKey = process.env.VAPI_API_KEY;

// Create an assistant programmatically
await axios.post('https://api.vapi.ai/assistant', {
  name: 'Hacienda Alakran',
  model: {...},
  // ...
}, {
  headers: {
    'Authorization': `Bearer ${vapiPrivateKey}`
  }
});

// Start a call programmatically
await axios.post('https://api.vapi.ai/call', {
  assistantId: 'asst_123',
  customer: { number: '+1234567890' }
}, {
  headers: {
    'Authorization': `Bearer ${vapiPrivateKey}`
  }
});
```

**Our webhook service doesn't do any of this!** It only receives data from Vapi.

## Assistant IDs

### What Is an Assistant ID?

Each assistant you create in Vapi gets a unique ID like: `asst_abc123def456`

### Where to Find It

1. Go to Vapi Dashboard
2. Click on your assistant
3. Look at the URL: `https://dashboard.vapi.ai/assistants/asst_abc123def456`
4. Or check the assistant settings page

### Do You Need Assistant IDs for Webhooks?

**NO!** Here's why:

```
┌─────────────────────────────────────────────────────────┐
│              How Webhooks Are Configured                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. You configure webhook URLs in a SPECIFIC assistant  │
│     in the Vapi dashboard                              │
│                                                         │
│  2. When THAT assistant handles a call, it sends       │
│     webhooks to the URLs you configured               │
│                                                         │
│  3. Your webhook service receives the data and        │
│     processes it - no need to know which assistant    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### When You WOULD Need Assistant IDs

Only if you're making API calls:

```typescript
// Example: Start a call with a specific assistant
await axios.post('https://api.vapi.ai/call', {
  assistantId: 'asst_abc123def456',  // ← Need this
  customer: { number: '+1234567890' }
});

// Example: Update an assistant
await axios.patch(`https://api.vapi.ai/assistant/asst_abc123def456`, {
  // updates
});
```

### Multiple Assistants

**Question**: "I have multiple assistants in Vapi. Do I need different webhook services?"

**Answer**: No! You can use the SAME webhook service for multiple assistants.

**Two Approaches:**

#### Approach 1: Same Webhooks for All Assistants (Recommended)
- Use the same webhook URLs for all your restaurant assistants
- Your service processes all requests the same way

```
┌──────────────────┐      ┌──────────────────────┐
│   Assistant 1    │ ───→ │                      │
│  "Alakran EN"    │      │  Your Webhook        │
├──────────────────┤      │  Service             │
│   Assistant 2    │ ───→ │                      │
│  "Alakran ES"    │      │  Same endpoints      │
├──────────────────┤      │  process all         │
│   Assistant 3    │ ───→ │  assistants          │
│  "Alakran FR"    │      │                      │
└──────────────────┘      └──────────────────────┘
```

#### Approach 2: Different Logic Per Assistant
If you need different behavior per assistant, check the incoming data:

```typescript
// In your webhook handler
export const checkAvailability = async (req: Request, res: Response) => {
  const { message } = req.body;

  // Vapi includes metadata about the call
  const assistantId = message.call?.assistantId;
  const metadata = message.call?.metadata;

  if (assistantId === 'asst_english_assistant') {
    // Handle English assistant
  } else if (assistantId === 'asst_spanish_assistant') {
    // Handle Spanish assistant
  }

  // Or use metadata you set in Vapi dashboard:
  if (metadata?.language === 'en') {
    // English logic
  }
};
```

But for a single restaurant with one language, you don't need this!

## Webhook Security (WEBHOOK_SECRET)

### What Is It?

A secret string you set to verify that webhook requests are actually coming from Vapi, not from attackers.

### How It Works

1. **You generate a secret**: Any random string (e.g., `my_super_secret_key_12345`)

2. **Configure in Vapi dashboard**: Add it to the webhook headers

   In Vapi → Assistant → Function Tools → Headers:
   ```json
   {
     "X-Webhook-Secret": "my_super_secret_key_12345"
   }
   ```

3. **Configure in your service**: Set the same value in `.env`
   ```env
   WEBHOOK_SECRET=my_super_secret_key_12345
   ```

4. **Your service validates**: Before processing requests

   ```typescript
   // Already implemented in src/middleware/validator.ts
   const receivedSecret = req.headers['x-webhook-secret'];
   if (receivedSecret !== process.env.WEBHOOK_SECRET) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

### Is It Required?

**No**, but recommended for production to prevent unauthorized webhook calls.

## Summary - What You Actually Need

### For This Webhook Service:

```
✅ Required:
- Public URL (ngrok or production domain)
- Webhook endpoints configured in Vapi dashboard

❌ Not Required:
- Vapi API Key (neither public nor private)
- Assistant IDs in your code
- Call IDs in your code

⚠️ Optional but Recommended:
- WEBHOOK_SECRET for security
```

### Configuration Checklist:

```
In Your Code (.env):
[ ] PORT=3000
[ ] WEBHOOK_SECRET=some_random_string (optional)

In Vapi Dashboard (for EACH assistant):
[ ] Function Tool: checkAvailabilityALAKRAN
    - URL: https://your-ngrok-url.ngrok-free.app/webhooks/check-availability
    - Headers: { "X-Webhook-Secret": "same_string_as_env" } (optional)

[ ] End of Call Webhook:
    - URL: https://your-ngrok-url.ngrok-free.app/webhooks/reservation-complete
    - Headers: { "X-Webhook-Secret": "same_string_as_env" } (optional)
    - Structured Data: enabled
```

## Example Configurations

### Minimal (No Security)

**.env**
```env
PORT=3000
NODE_ENV=development
```

**Vapi Dashboard**
- Webhook URL: `https://abc123.ngrok-free.app/webhooks/check-availability`
- Headers: (none)

### Recommended (With Security)

**.env**
```env
PORT=3000
NODE_ENV=development
WEBHOOK_SECRET=HdK9#mN2$pQw5@xZ8!jL
```

**Vapi Dashboard**
- Webhook URL: `https://abc123.ngrok-free.app/webhooks/check-availability`
- Headers:
  ```json
  {
    "X-Webhook-Secret": "HdK9#mN2$pQw5@xZ8!jL"
  }
  ```

### Advanced (Making API Calls to Vapi)

Only if you want to programmatically manage Vapi:

**.env**
```env
PORT=3000
NODE_ENV=development
WEBHOOK_SECRET=HdK9#mN2$pQw5@xZ8!jL
VAPI_API_KEY=sk_live_abc123def456...
```

**Then in code:**
```typescript
import axios from 'axios';

// Example: Get call details after webhook
const callId = message.call.id;
const response = await axios.get(`https://api.vapi.ai/call/${callId}`, {
  headers: {
    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
  }
});
```

## Common Questions

### Q: I have 5 different restaurant assistants. Do I need 5 webhook services?

**A**: No! Use the same webhook service for all. Configure the same webhook URLs in all 5 assistants.

### Q: How does my webhook know which assistant called it?

**A**: Vapi includes metadata in the webhook payload:
```javascript
const assistantId = req.body.message.call?.assistantId;
const metadata = req.body.message.call?.metadata;
```

But for most cases, you don't need to distinguish - just process the reservation data!

### Q: Can I test webhooks without ngrok?

**A**: Not really. You need a public URL for Vapi to call. Options:
1. ngrok (easiest for testing)
2. Deploy to Railway/Render free tier
3. Use your own server with public IP

### Q: What if I restart ngrok and the URL changes?

**A**: Free ngrok URLs change on restart. You must:
1. Copy the new URL
2. Update it in Vapi dashboard
3. Or upgrade to ngrok paid plan for persistent URLs
4. Or deploy to production for permanent URL

### Q: Do webhooks work with Vapi's test assistant?

**A**: Yes! Configure webhooks the same way in test assistants.

## Need More Help?

- Vapi Webhooks Docs: https://docs.vapi.ai/webhooks
- Vapi Function Tools: https://docs.vapi.ai/tools/function
- This project: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
