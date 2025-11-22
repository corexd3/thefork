#!/bin/bash
# Start server with full logging to file
LOGFILE="server-$(date +%Y%m%d-%H%M%S).log"
echo "Starting server with logging to: $LOGFILE"
echo "Press Ctrl+C to stop"
echo ""
npm run dev 2>&1 | tee "$LOGFILE"
