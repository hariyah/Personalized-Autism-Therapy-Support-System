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
echo "    1. gateway                     (Express, port 7777)"
echo "    2. autism-profile-builder      (Flask, port 7001)"
echo "    3. cognitive-activity-recommender (FastAPI, port 7002)"
echo "    4. emotional-activity-recommender (Node, port 7003)"
echo "    5. emotional-activity-recommender-ml (FastAPI, port 7004)"
echo "    6. therapy-collab             (Node, port 7005)"
echo "    7. therapy-collab-ai           (Python, port 7006)"
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

# 1. Gateway (Express, port 7777)
if [ -d "$GATEWAY" ]; then
  setup_node_deps "$GATEWAY" || true
  echo "Starting gateway..."
  (cd "$GATEWAY" && PORT=7777 npm start) &
  pids+=($!)
  sleep 2
fi

# 2. Autism Profile Builder (Flask, port 7001)
if [ -d "$SERVICES/autism-profile-builder" ]; then
  setup_python_venv "$SERVICES/autism-profile-builder" || true
  echo "Starting autism-profile-builder..."
  (
    cd "$SERVICES/autism-profile-builder"
    export FLASK_APP=app.py FLASK_RUN_PORT=7001
    if [ -x .venv/bin/python ]; then
      .venv/bin/python app.py
    else
      python3 app.py
    fi
  ) &
  pids+=($!)
  sleep 2
fi

# 3. Cognitive Activity Recommender (FastAPI, port 7002)
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

# 4. Emotional Activity Recommender (Node, port 7003)
if [ -d "$SERVICES/emotional-activity-recommender" ]; then
  setup_node_deps "$SERVICES/emotional-activity-recommender" || true
  echo "Starting emotional-activity-recommender..."
  (cd "$SERVICES/emotional-activity-recommender" && PORT=7003 npm start) &
  pids+=($!)
  sleep 2
fi

# 5. Emotional Activity Recommender ML (FastAPI, port 7004)
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

# 6. Therapy Collab (Node, port 7005)
if [ -d "$SERVICES/therapy-collab" ]; then
  setup_node_deps "$SERVICES/therapy-collab" || true
  echo "Starting therapy-collab..."
  (cd "$SERVICES/therapy-collab" && PORT=7005 AI_URL=http://localhost:7006/analyze-voice AI_TEXT_URL=http://localhost:7006/analyze-text npm start) &
  pids+=($!)
  sleep 2
fi

# 7. Therapy Collab AI (Python, port 7006)
if [ -d "$SERVICES/therapy-collab-ai" ]; then
  setup_python_venv "$SERVICES/therapy-collab-ai" || true
  echo "Starting therapy-collab-ai..."
  (
    cd "$SERVICES/therapy-collab-ai"
    export PORT=7006
    if [ -x .venv/bin/python ]; then
      .venv/bin/python main.py
    else
      python3 main.py
    fi
  ) &
  pids+=($!)
fi

echo ""
echo "================================================"
echo "  Services started. Press Ctrl+C to stop all."
echo "  gateway:                   http://localhost:7777"
echo "  autism-profile-builder:    http://localhost:7001"
echo "  cognitive-activity-recommender: http://localhost:7002"
echo "  emotional-activity-recommender:  http://localhost:7003"
echo "  emotional-activity-recommender-ml: http://localhost:7004"
echo "  therapy-collab:            http://localhost:7005"
echo "  therapy-collab-ai:         http://localhost:7006"
echo "================================================"
echo ""

wait
