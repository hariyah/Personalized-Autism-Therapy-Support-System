#!/bin/bash

# Port configuration
# Hugging Face Spaces assigns PORT=7860. The gateway must run on this port.
GATEWAY_PORT=${PORT:-7860}

echo "Starting Backend Microservices..."

# 1. Autism Profile Builder (Flask, port 7001)
echo "Starting profile-builder on 7001..."
cd /app/backend/services/autism-profile-builder
python app.py &

# 2. Cognitive Activity Recommender (FastAPI, port 7002)
echo "Starting cognitive-recommender on 7002..."
cd /app/backend/services/cognitive-activity-recommender
uvicorn app.main:app --host 0.0.0.0 --port 7002 &

# 3. Emotional Activity Recommender (Node, port 7003)
echo "Starting emotional-recommender on 7003..."
cd /app/backend/services/emotional-activity-recommender
PORT=7003 npm start &

# 4. Emotional Activity Recommender ML (FastAPI, port 7004)
echo "Starting emotional-recommender-ml on 7004..."
cd /app/backend/services/emotional-activity-recommender-ml
python app.py &

# 5. Therapy Collab (Node, port 7005)
echo "Starting therapy-collab on 7005..."
cd /app/backend/services/therapy-collab
PORT=7005 AI_URL=http://127.0.0.1:7006/analyze-voice AI_TEXT_URL=http://127.0.0.1:7006/analyze-text npm start &

# 6. Therapy Collab AI (Python, port 7006)
echo "Starting therapy-collab-ai on 7006..."
cd /app/backend/services/therapy-collab-ai
PORT=7006 python main.py &

# Wait a few seconds for services to boot up
sleep 5

# 7. Gateway (Express, running on $GATEWAY_PORT)
echo "Starting API Gateway on $GATEWAY_PORT..."
cd /app/backend/gateway
PORT=$GATEWAY_PORT npm start
