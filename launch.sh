#!/usr/bin/env bash
# BuddyAI — launch backend + frontend concurrently
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Verify API key
if [ -z "$ANTHROPIC_API_KEY" ] && [ ! -f "$ROOT/backend/.env" ]; then
  echo "ERROR: Set ANTHROPIC_API_KEY or create backend/.env from backend/.env.example"
  exit 1
fi

echo "Starting BuddyAI backend on :8000 ..."
cd "$ROOT/backend"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting BuddyAI frontend on :3000 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend : http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait $BACKEND_PID $FRONTEND_PID
