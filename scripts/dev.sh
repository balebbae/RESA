#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/tmp/logs"
SESSION_NAME="resa-dev"

mkdir -p "$LOG_DIR"

find_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
    return 0
  fi
  return 1
}

COMPOSE_CMD=""
if ! COMPOSE_CMD=$(find_compose); then
  echo "Error: Docker Compose not found. Install Docker Desktop or docker-compose." >&2
  exit 1
fi

start_docker_services() {
  echo "[dev] Starting Docker services (detached) in $BACKEND_DIR ..."
  (cd "$BACKEND_DIR" && $COMPOSE_CMD up -d)
}

tmux_available() {
  command -v tmux >/dev/null 2>&1
}

start_with_tmux() {
  echo "[dev] tmux detected. Launching tmux session '$SESSION_NAME'..."
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "[dev] Session '$SESSION_NAME' already exists. Attaching..."
    exec tmux attach -t "$SESSION_NAME"
  fi

  # Create session with a first window for Docker logs
  tmux new-session -d -s "$SESSION_NAME" -n docker \
    "cd '$BACKEND_DIR' && $COMPOSE_CMD up -d && $COMPOSE_CMD logs -f"

  # Backend window running air
  tmux new-window -t "$SESSION_NAME":2 -n backend \
    "cd '$BACKEND_DIR' && if ! command -v air >/dev/null 2>&1; then echo 'air not found. Install with: go install github.com/air-verse/air@latest'; fi; exec air"

  # Frontend window running next dev
  tmux new-window -t "$SESSION_NAME":3 -n frontend \
    "cd '$FRONTEND_DIR' && npm run dev"

  tmux select-window -t "$SESSION_NAME":2
  echo "[dev] tmux session '$SESSION_NAME' is ready. Use 'tmux attach -t $SESSION_NAME' to reattach."
  exec tmux attach -t "$SESSION_NAME"
}

PIDS=()
cleanup() {
  echo "\n[dev] Stopping background processes..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait || true
}
trap cleanup EXIT INT TERM

start_without_tmux() {
  echo "[dev] tmux not found. Starting services in the background and tailing logs."
  start_docker_services

  # Backend (air)
  (
    cd "$BACKEND_DIR"
    if ! command -v air >/dev/null 2>&1; then
      echo "[backend] air not found. Install: go install github.com/air-verse/air@latest" | tee -a "$LOG_DIR/backend.log"
    fi
    exec air
  ) >"$LOG_DIR/backend.log" 2>&1 &
  PIDS+=($!)

  # Frontend (npm run dev)
  (
    cd "$FRONTEND_DIR"
    exec npm run dev
  ) >"$LOG_DIR/frontend.log" 2>&1 &
  PIDS+=($!)

  echo "[dev] Logs:"
  echo "  - $LOG_DIR/backend.log"
  echo "  - $LOG_DIR/frontend.log"
  echo "[dev] Press Ctrl-C to stop."
  tail -n +1 -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
}

# Always ensure Docker services are up first
start_docker_services

# Prefer tmux orchestration
if tmux_available; then
  start_with_tmux
else
  start_without_tmux
fi


