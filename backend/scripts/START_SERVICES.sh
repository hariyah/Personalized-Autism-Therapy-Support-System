#!/bin/bash
# Run all backend services (backend/services/*)
# Usage: run from repo root or from this script's directory.
# Script lives at backend/scripts/ → repo root is ../..

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICES="$REPO_ROOT/backend/services"
GATEWAY="$REPO_ROOT/backend/gateway"

echo ""
echo "================================================"
echo "  BACKEND SERVICES STARTUP"
echo "================================================"
echo "  Repo root: $REPO_ROOT"
echo "  Services:  $SERVICES"
echo ""
echo "  Starting:"
echo "    1. autism-profile-builder      (Flask, port 7001)"
echo "    2. cognitive-activity-recommender (FastAPI, port 7002)"
echo "    3. emotional-activity-recommender (Node, port 3001)"
echo "    4. emotional-activity-recommender-ml (FastAPI, port 5000)"
echo "    5. gateway                     (Express, port 7777)"
echo ""

# Create Python venv if needed, then install/update requirements
setup_python_venv() {
  local dir="$1"
  if [ ! -d "$dir" ] || [ ! -f "$dir/requirements.txt" ]; then return 1; fi
  if [ ! -x "$dir/.venv/bin/python" ]; then
    echo "  Creating venv in $(basename "$dir")..."
    (cd "$dir" && python3 -m venv .venv)
  fi
  echo "  Installing/updating Python requirements in $(basename "$dir")..."
  (cd "$dir" && if [ -x .venv/bin/pip ]; then .venv/bin/pip install -q -r requirements.txt; else pip3 install -q -r requirements.txt; fi)
}

# npm install then run: install/update deps before start
setup_node_deps() {
  local dir="$1"
  if [ ! -d "$dir" ] || [ ! -f "$dir/package.json" ]; then return 1; fi
  echo "  Installing/updating npm dependencies in $(basename "$dir")..."
  (cd "$dir" && npm install)
}

pids=()
cleanup() {
  echo ""
  echo "Stopping services..."
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Autism Profile Builder (Flask, port 7001)
if [ -d "$SERVICES/autism-profile-builder" ]; then
  setup_python_venv "$SERVICES/autism-profile-builder" || true
  echo "Starting autism-profile-builder..."
  (
    cd "$SERVICES/autism-profile-builder"
    if [ -x .venv/bin/python ]; then
      PORT=7001 .venv/bin/python app.py
    else
      PORT=7001 python3 app.py
    fi
  ) &
  pids+=($!)
  sleep 2
fi

# 2. Cognitive Activity Recommender (FastAPI)
if [ -d "$SERVICES/cognitive-activity-recommender" ]; then
  setup_python_venv "$SERVICES/cognitive-activity-recommender" || true
  echo "Starting cognitive-activity-recommender..."
  (
    cd "$SERVICES/cognitive-activity-recommender"
    if [ -x .venv/bin/python ]; then
      .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 7002
    else
      python3 -m uvicorn app.main:app --host 0.0.0.0 --port 7002
    fi
  ) &
  pids+=($!)
  sleep 2
fi

# 3. Emotional Activity Recommender (Node)
if [ -d "$SERVICES/emotional-activity-recommender" ]; then
  setup_node_deps "$SERVICES/emotional-activity-recommender" || true
  echo "Starting emotional-activity-recommender..."
  (cd "$SERVICES/emotional-activity-recommender" && npm start) &
  pids+=($!)
  sleep 2
fi

# 4. Emotional Activity Recommender ML (FastAPI, port 5000)
if [ -d "$SERVICES/emotional-activity-recommender-ml" ]; then
  setup_python_venv "$SERVICES/emotional-activity-recommender-ml" || true
  echo "Starting emotional-activity-recommender-ml..."
  (
    cd "$SERVICES/emotional-activity-recommender-ml"
    if [ -x .venv/bin/python ]; then
      .venv/bin/python app.py
    else
      python3 app.py
    fi
  ) &
  pids+=($!)
  sleep 2
fi

# 5. Gateway (Express, port 7777)
if [ -d "$GATEWAY" ]; then
  setup_node_deps "$GATEWAY" || true
  echo "Starting gateway..."
  (cd "$GATEWAY" && npm start) &
  pids+=($!)
fi

echo ""
echo "================================================"
echo "  Services started. Press Ctrl+C to stop all."
echo "  gateway:                   http://localhost:7777"
echo "  autism-profile-builder:    http://localhost:7001"
echo "  cognitive-activity-recommender: http://localhost:7002"
echo "  emotional-activity-recommender:  http://localhost:3001"
echo "  emotional-activity-recommender-ml: http://localhost:5000"
echo "================================================"
echo ""

wait
