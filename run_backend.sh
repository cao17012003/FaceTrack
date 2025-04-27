#!/bin/bash

# Kill any process running on port 8000 (Django's default port)
echo "Checking for processes on port 8000..."
if lsof -ti:8000 >/dev/null ; then
  echo "Killing process on port 8000"
  lsof -ti:8000 | xargs kill -9
  echo "Process killed"
else
  echo "No process running on port 8000"
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
fi

# Run Django server
echo "Starting backend server..."
python manage.py runserver

# Log server start
echo "$(date): Backend server started" >> backend_logs.txt
