#!/bin/bash

echo "Restarting BMW Marketing Dashboard server..."

# Find process using port 3000 and kill it
PID=$(lsof -t -i:3000)
if [ -n "$PID" ]; then
  echo "Killing process $PID using port 3000..."
  kill -9 $PID
  sleep 1
else
  echo "No process found running on port 3000"
fi

# Start server in the background
echo "Starting server..."
npm run dev &

# Wait a moment for server to start
sleep 2
echo "Server restarted at http://localhost:3000" 