#!/bin/bash
# Double-click this file (or run in Terminal) to launch the AI Innovators Network demo.

cd "$(dirname "$0")"

# Open browser after a short delay (server usually ready in 5–8 sec)
( sleep 8 && open "http://localhost:3000" ) &

echo "🚀 Launching AI Innovators Network..."
echo "   Browser will open at http://localhost:3000"
echo "   If it doesn't, open that URL yourself."
echo ""

./launch.sh
