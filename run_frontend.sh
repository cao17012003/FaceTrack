#!/bin/bash

# Kill any process running on port 3000 (React's default port)
echo "Checking for processes on port 3000..."
if lsof -ti:3000 >/dev/null ; then
  echo "Killing process on port 3000"
  lsof -ti:3000 | xargs kill -9
  echo "Process killed"
else
  echo "No process running on port 3000"
fi

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Install dependencies if node_modules doesn't exist or package.json has changed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Installing or updating npm packages..."
  npm install
fi

# Run React development server
echo "Starting frontend server..."
npm start

# Log server start
echo "$(date): Frontend server started" >> frontend_logs.txt
