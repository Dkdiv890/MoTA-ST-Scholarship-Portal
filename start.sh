#!/bin/bash
set -e

echo "Starting FastAPI backend on port 8000..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

echo "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/ > /dev/null 2>&1; then
    echo "Backend ready!"
    break
  fi
  sleep 1
done

echo "Starting Next.js frontend on port 7860..."
cd /app/frontend
export PORT=7860
export HOSTNAME="0.0.0.0"
export BACKEND_URL="http://127.0.0.1:8000"
exec npx next start -p 7860 -H 0.0.0.0
