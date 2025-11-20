# Setup Diagram - How Everything Connects

## ❌ WRONG - This Will NOT Work

```
┌──────────────┐
│   Vapi.ai    │
│  (Internet)  │
└──────┬───────┘
       │
       │ ❌ Tries to call http://localhost:3000
       │    But localhost is YOUR computer, not accessible!
       ↓
   ⚠️ FAILS ⚠️
```

**Why it fails:**
- Vapi servers are on the internet
- Your computer (localhost) is behind your router/firewall
- No route from internet to localhost:3000

## ✅ CORRECT - Using ngrok

```
┌──────────────────────────────────────────────────────────┐
│                    Internet                              │
│                                                          │
│   ┌──────────────┐                                      │
│   │   Vapi.ai    │                                      │
│   │   Servers    │                                      │
│   └──────┬───────┘                                      │
│          │                                               │
│          │ ✅ Calls https://abc123.ngrok-free.app       │
│          │                                               │
│          ↓                                               │
│   ┌──────────────┐                                      │
│   │    ngrok     │                                      │
│   │   Servers    │                                      │
│   └──────┬───────┘                                      │
│          │                                               │
└──────────┼───────────────────────────────────────────────┘
           │
           │ Secure tunnel through firewall
           │
┌──────────┼───────────────────────────────────────────────┐
│          │              Your Computer                    │
│          ↓                                               │
│   ┌──────────────┐         ┌──────────────┐            │
│   │    ngrok     │ ←────→ │  Your Service │            │
│   │    client    │         │ localhost:3000│            │
│   └──────────────┘         └──────────────┘            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why it works:**
- ngrok creates a secure tunnel from internet to your localhost
- Vapi calls public ngrok URL
- ngrok forwards to your localhost:3000
- Your service responds through the tunnel

## Your Development Setup - 3 Terminals

```
┌─────────────────────────────────────────────────────────┐
│ Terminal 1: Your Service                                │
│ $ npm run dev                                           │
│ > Server running on port 3000                          │
│ > Waiting for requests...                              │
└─────────────────────────────────────────────────────────┘
                        ↑
                        │ localhost traffic
                        │
┌─────────────────────────────────────────────────────────┐
│ Terminal 2: ngrok Tunnel                                │
│ $ ngrok http 3000                                       │
│                                                         │
│ Forwarding: https://abc123.ngrok-free.app              │
│             → http://localhost:3000                     │
│                                                         │
│ Copy this URL! ↑                                        │
└─────────────────────────────────────────────────────────┘
                        ↑
                        │ internet traffic
                        │
                   ┌────┴────┐
                   │  Vapi   │
                   └─────────┘
```

## Complete Data Flow

```
1. Customer Calls
   ↓
┌──────────────────┐
│   Vapi Phone     │
│     System       │
└────────┬─────────┘
         │
         │ 2. Vapi AI processes conversation
         │
         ↓
┌──────────────────┐
│ Vapi determines  │
│ need to check    │
│ availability     │
└────────┬─────────┘
         │
         │ 3. HTTP POST to:
         │    https://abc123.ngrok-free.app/webhooks/check-availability
         │    Body: { fecha, hora, personas }
         ↓
┌──────────────────┐
│  ngrok Servers   │ (on internet)
└────────┬─────────┘
         │
         │ 4. Tunnel through firewall
         ↓
┌──────────────────┐
│  ngrok Client    │ (your computer)
└────────┬─────────┘
         │
         │ 5. Forward to localhost:3000
         ↓
┌──────────────────┐
│  Your Service    │
│  - Validates     │
│  - Logs          │
│  - Checks API    │
│  - Responds      │
└────────┬─────────┘
         │
         │ 6. Response flows back
         ↓
      (ngrok)
         ↓
      (internet)
         ↓
┌──────────────────┐
│      Vapi        │
└────────┬─────────┘
         │
         │ 7. Vapi tells customer
         ↓
┌──────────────────┐
│    Customer      │
│ "Sí, tenemos     │
│  disponibilidad" │
└──────────────────┘
```

## Production Setup (No ngrok needed)

```
┌──────────────────────────────────────────────────────────┐
│                    Internet                              │
│                                                          │
│   ┌──────────────┐                                      │
│   │   Vapi.ai    │                                      │
│   └──────┬───────┘                                      │
│          │                                               │
│          │ ✅ Calls https://your-app.railway.app        │
│          │                                               │
│          ↓                                               │
│   ┌──────────────────────────────────────────┐         │
│   │  Production Server                       │         │
│   │  (Railway / Render / Heroku / AWS)       │         │
│   │                                          │         │
│   │  ┌─────────────────────────────────┐    │         │
│   │  │   Your Service                   │    │         │
│   │  │   - Has permanent HTTPS URL      │    │         │
│   │  │   - Always accessible            │    │         │
│   │  │   - No tunnel needed             │    │         │
│   │  └─────────────────────────────────┘    │         │
│   └──────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## URL Comparison

### ❌ Will NOT Work with Vapi
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://192.168.1.100:3000` (your local IP)

### ✅ WILL Work with Vapi
- `https://abc123.ngrok-free.app` (ngrok tunnel)
- `https://your-app.railway.app` (Railway deployment)
- `https://your-app.onrender.com` (Render deployment)
- `https://your-app.herokuapp.com` (Heroku deployment)
- `https://api.yourcompany.com` (custom domain)

## Checklist

Before configuring Vapi webhooks:

- [ ] Service running locally (`npm run dev`)
- [ ] Can access http://localhost:3000/health
- [ ] ngrok installed
- [ ] ngrok running (`ngrok http 3000`)
- [ ] Copied HTTPS URL from ngrok (starts with https://)
- [ ] Can access https://YOUR-URL.ngrok-free.app/health
- [ ] Using ngrok URL in Vapi (NOT localhost)

## Testing the Connection

### Step 1: Test Local
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"healthy",...}`

### Step 2: Test ngrok
```bash
curl https://abc123.ngrok-free.app/health
```
Should return: Same as above

### Step 3: Check ngrok Dashboard
Open: http://127.0.0.1:4040

You should see your request listed there.

### Step 4: Test from Vapi
Configure webhook in Vapi, make test call.

Watch both:
- Your service terminal (should show incoming request)
- ngrok dashboard (should show the request)

## Common Mistakes

### 1. Using localhost in Vapi
```
❌ http://localhost:3000/webhooks/check-availability
✅ https://abc123.ngrok-free.app/webhooks/check-availability
```

### 2. Using HTTP instead of HTTPS
```
❌ http://abc123.ngrok-free.app/webhooks/check-availability
✅ https://abc123.ngrok-free.app/webhooks/check-availability
```

### 3. Forgetting to start ngrok
```
Service running ✓
ngrok running  ❌  ← This is required!
```

### 4. Using old ngrok URL after restart
Free ngrok URLs change on restart:
- First run: `https://abc123.ngrok-free.app`
- After restart: `https://xyz789.ngrok-free.app` ← Different!

You must update Vapi with new URL.

## Summary

**Simple Rule:**
- If URL starts with `localhost` → ❌ Won't work with Vapi
- If URL starts with `https://` and is publicly accessible → ✅ Will work

**For Development:**
Use ngrok to expose localhost to internet.

**For Production:**
Deploy to hosting platform with permanent HTTPS URL.

---

**Keep this diagram handy when setting up!** 📊
