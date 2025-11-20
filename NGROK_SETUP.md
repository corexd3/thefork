# ngrok Setup Guide

## Why You Need ngrok

⚠️ **IMPORTANT**: Vapi.ai servers run on the internet and **CANNOT access `localhost:3000`**.

When you configure webhooks in Vapi, Vapi's servers need to send HTTP requests to your service. Since your service is running on your local machine, it's not accessible from the internet. ngrok creates a secure tunnel that exposes your local server to the internet.

```
┌─────────────┐
│    Vapi     │ (on the internet)
└──────┬──────┘
       │ ❌ Cannot reach localhost:3000
       │ ✅ CAN reach https://abc123.ngrok-free.app
       ↓
┌─────────────┐
│    ngrok    │ (secure tunnel)
│   tunnel    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  localhost  │ (your computer)
│   port 3000 │
└─────────────┘
```

## Step 1: Install ngrok

### Option A: Download from Website
1. Go to https://ngrok.com/download
2. Download for your operating system
3. Extract and move to a directory in your PATH

### Option B: Package Manager

**macOS (Homebrew):**
```bash
brew install ngrok
```

**Linux (Snap):**
```bash
snap install ngrok
```

**Windows (Chocolatey):**
```bash
choco install ngrok
```

## Step 2: Sign Up for ngrok Account (Optional but Recommended)

1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
4. Configure ngrok with your token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

**Benefits of signing up:**
- Longer session times
- More concurrent tunnels
- Custom domains (paid plans)
- Persistent URLs (paid plans)

## Step 3: Start Your Service

In your project directory:

```bash
npm run dev
```

You should see:
```
Server running on port 3000
```

**Keep this terminal open!**

## Step 4: Start ngrok

**Open a NEW terminal** and run:

```bash
ngrok http 3000
```

You should see output like this:

```
ngrok

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## Step 5: Copy Your Public URL

Look for the line that says **Forwarding**:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL: `https://abc123.ngrok-free.app`

⚠️ **Your URL will be different!** Each ngrok session gets a unique URL.

## Step 6: Test Your Public URL

In a third terminal (or browser):

```bash
curl https://abc123.ngrok-free.app/health
```

(Replace with YOUR ngrok URL)

You should get:
```json
{
  "status": "healthy",
  "service": "Hacienda Alakran Vapi Service",
  "timestamp": "2025-11-19T15:41:00.000Z"
}
```

## Step 7: Configure Vapi with ngrok URL

Now use your ngrok URL in Vapi dashboard:

**Availability Check Webhook:**
```
https://abc123.ngrok-free.app/webhooks/check-availability
```

**Reservation Complete Webhook:**
```
https://abc123.ngrok-free.app/webhooks/reservation-complete
```

⚠️ **Replace `abc123.ngrok-free.app` with YOUR actual URL!**

## Step 8: Monitor Requests

ngrok provides a web interface to inspect requests:

1. Open http://127.0.0.1:4040 in your browser
2. You'll see all HTTP requests going through the tunnel
3. This is great for debugging!

You can:
- See request headers
- See request body
- See response status
- Replay requests
- Inspect timing

## Common ngrok Commands

### Basic tunnel
```bash
ngrok http 3000
```

### Custom subdomain (requires paid plan)
```bash
ngrok http 3000 --subdomain=alakran
```

### Specific region
```bash
ngrok http 3000 --region=us
```

### With basic auth
```bash
ngrok http 3000 --basic-auth="username:password"
```

## Important Notes

### Free Plan Limitations

⚠️ **URL Changes**: Free ngrok URLs change every time you restart ngrok!

If you stop ngrok and start it again, you'll get a NEW URL like:
- First session: `https://abc123.ngrok-free.app`
- Second session: `https://xyz789.ngrok-free.app` (different!)

**This means you need to update Vapi webhooks every time you restart ngrok.**

### Solutions:

1. **Keep ngrok running** during development
2. **Upgrade to paid plan** for persistent URLs ($8/month for custom domains)
3. **Deploy to production** for permanent URLs

### Session Timeouts

Free accounts: Sessions expire after 2 hours (you'll need to restart)
Paid accounts: Longer or unlimited sessions

## Troubleshooting

### "command not found: ngrok"

**Solution**: ngrok is not in your PATH. Either:
- Add it to PATH
- Run with full path: `/path/to/ngrok http 3000`
- Reinstall using package manager

### "connection refused"

**Solution**: Your local service isn't running
- Make sure `npm run dev` is running
- Check it's on port 3000: `curl http://localhost:3000/health`

### "tunnel not found"

**Solution**: Free account limit reached
- Stop other ngrok tunnels
- Or upgrade to paid plan

### "ERR_NGROK_xxxx" errors

**Solution**:
- Check your auth token is configured
- Verify your account is active
- Check ngrok status page: https://status.ngrok.com/

### Webhook still not working

**Checklist:**
- [ ] Local service is running (`npm run dev`)
- [ ] ngrok is running and showing "online"
- [ ] You copied the HTTPS URL (not HTTP)
- [ ] You can access the URL from your browser
- [ ] You updated Vapi with the ngrok URL
- [ ] You didn't include `localhost` in Vapi config

## Best Practices

1. **Use two terminals:**
   - Terminal 1: `npm run dev` (your service)
   - Terminal 2: `ngrok http 3000` (the tunnel)

2. **Monitor both:**
   - Watch your service logs for incoming requests
   - Watch ngrok web interface (http://127.0.0.1:4040) for request details

3. **Test before Vapi:**
   ```bash
   # Test local
   curl http://localhost:3000/health

   # Test ngrok
   curl https://your-ngrok-url.ngrok-free.app/health
   ```

4. **Keep ngrok running:**
   - Don't close the ngrok terminal during testing
   - URL changes if you restart ngrok

## Alternative to ngrok

If you prefer not to use ngrok, you can:

1. **Deploy to cloud immediately:**
   - Railway.app (free tier)
   - Render.com (free tier)
   - Fly.io (free tier)
   - Heroku (paid)

2. **Use other tunneling services:**
   - localtunnel: `npx localtunnel --port 3000`
   - cloudflared: Cloudflare Tunnel
   - serveo: `ssh -R 80:localhost:3000 serveo.net`

## Production Deployment

For production, DON'T use ngrok. Instead:

1. Deploy to a hosting platform
2. Get a permanent HTTPS URL
3. Configure Vapi with that URL
4. Much more reliable than tunneling

See [README.md](README.md) for deployment options.

## Quick Reference

```bash
# Start your service
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Copy the HTTPS URL from the output
# Format: https://abc123.ngrok-free.app

# Use in Vapi:
# - https://YOUR-URL.ngrok-free.app/webhooks/check-availability
# - https://YOUR-URL.ngrok-free.app/webhooks/reservation-complete

# Monitor requests at:
# http://127.0.0.1:4040
```

## Getting Help

- ngrok documentation: https://ngrok.com/docs
- ngrok community: https://ngrok.com/slack
- Check status: https://status.ngrok.com/
