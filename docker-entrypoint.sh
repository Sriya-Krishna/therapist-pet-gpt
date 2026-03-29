#!/bin/sh
set -e

cd /app/backend

# Seed the database if it doesn't exist yet
if [ ! -f mindbridge.db ]; then
  echo "Seeding database..."
  python seed.py
fi

# Serve the app — backend API + static frontend
exec uvicorn main:app --host 0.0.0.0 --port 8000
