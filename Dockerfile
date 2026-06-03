# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including Node.js and librosa dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libsndfile1 \
    ffmpeg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up app directory
WORKDIR /app

# Copy package.json files and install Node dependencies first (for caching)
COPY backend/gateway/package*.json ./backend/gateway/
RUN cd backend/gateway && npm ci --only=production

COPY backend/services/emotional-activity-recommender/package*.json ./backend/services/emotional-activity-recommender/
RUN cd backend/services/emotional-activity-recommender && npm ci --only=production

COPY backend/services/therapy-collab/package*.json ./backend/services/therapy-collab/
RUN cd backend/services/therapy-collab && npm ci --only=production

# Install Python dependencies globally
COPY backend/services/autism-profile-builder/requirements.txt ./autism-profile-builder-req.txt
COPY backend/services/cognitive-activity-recommender/requirements.txt ./cognitive-recommender-req.txt
COPY backend/services/emotional-activity-recommender-ml/requirements.txt ./emotional-ml-req.txt
COPY backend/services/therapy-collab-ai/requirements.txt ./therapy-ai-req.txt

RUN pip install --no-cache-dir -r autism-profile-builder-req.txt \
    && pip install --no-cache-dir -r cognitive-recommender-req.txt \
    && pip install --no-cache-dir -r emotional-ml-req.txt \
    && pip install --no-cache-dir -r therapy-ai-req.txt

# Copy the rest of the application code
COPY . .

# Make the startup script executable
RUN chmod +x start.sh

# Expose port 7860 (Hugging Face Spaces default port)
EXPOSE 7860

# Run the startup script
CMD ["./start.sh"]
