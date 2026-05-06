/**
 * API Gateway - single entry point for backend services.
 * Runs on port 7000. Proxies by path prefix to:
 *   /profile-builder  -> autism-profile-builder (7001)
 *   /cognitive        -> cognitive-activity-recommender (7002)
 *   /emotional        -> emotional-activity-recommender (7003)
 *   /emotion-ml       -> emotional-activity-recommender-ml (7004)
 *   /therapy-ai       -> therapy-collab-ai (7006)
 *   /therapy          -> therapy-collab (7005)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const PORT = Number(process.env.PORT) || 7000;

const SERVICES = {
  profileBuilder: process.env.PROFILE_BUILDER_URL || "http://localhost:7001",
  cognitive: process.env.COGNITIVE_URL || "http://localhost:7002",
  emotional: process.env.EMOTIONAL_URL || "http://localhost:7003",
  emotionMl: process.env.EMOTION_ML_URL || "http://localhost:7004",
  therapy: process.env.THERAPY_URL || "http://localhost:7005",
  therapyAi: process.env.THERAPY_AI_URL || "http://127.0.0.1:7006",
};

/** Strip trailing slash for safe URL joins (http-proxy-middleware v3 mount rules). */
function origin(url) {
  return String(url || "").replace(/\/+$/, "");
}

const app = express();
app.use(cors());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    gateway: "running",
    port: PORT,
    services: {
      profileBuilder: "/profile-builder",
      cognitive: "/cognitive",
      emotional: "/emotional",
      emotionMl: "/emotion-ml",
      therapyAi: "/therapy-ai",
      therapy: "/therapy",
      auth: "/api/auth -> profile-builder",
      profileApi: "/api/* (patients, health, ocr, … -> profile-builder)",
    },
  });
});

// http-proxy-middleware v3: when using app.use(MOUNT, proxy), put MOUNT on target URL
// (see https://github.com/chimurai/http-proxy-middleware/blob/master/MIGRATION_V3.md).

const pb = origin(SERVICES.profileBuilder);

// Common auth: /api/auth/* -> autism-profile-builder /api/auth/*
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: `${pb}/api/auth`,
    changeOrigin: true,
    onError: (err, req, res) => {
      res.status(502).json({ error: "Auth service unavailable", message: err.message });
    },
  })
);

// Other profile-builder JSON routes: /api/patients, /api/health, /api/ocr, /api/predict, …
// Registered after /api/auth so /api/auth/* stays on the auth proxy above.
app.use(
  "/api",
  createProxyMiddleware({
    target: `${pb}/api`,
    changeOrigin: true,
    onError: (err, req, res) => {
      res.status(502).json({ error: "Profile API unavailable", message: err.message });
    },
  })
);

// Proxy: /profile-builder/* -> autism-profile-builder (strip prefix so backend sees /api/...)
app.use(
  "/profile-builder",
  createProxyMiddleware({
    target: pb,
    changeOrigin: true,
    pathRewrite: { "^/profile-builder": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Profile builder unavailable", message: err.message });
    },
  })
);

// Proxy: /cognitive/* -> cognitive-activity-recommender
app.use(
  "/cognitive",
  createProxyMiddleware({
    target: origin(SERVICES.cognitive),
    changeOrigin: true,
    pathRewrite: { "^/cognitive": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Cognitive recommender unavailable", message: err.message });
    },
  })
);

// Proxy: /emotional/* -> emotional-activity-recommender
app.use(
  "/emotional",
  createProxyMiddleware({
    target: origin(SERVICES.emotional),
    changeOrigin: true,
    pathRewrite: { "^/emotional": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Emotional recommender unavailable", message: err.message });
    },
  })
);

// Proxy: /emotion-ml/* -> emotional-activity-recommender-ml
app.use(
  "/emotion-ml",
  createProxyMiddleware({
    target: origin(SERVICES.emotionMl),
    changeOrigin: true,
    pathRewrite: { "^/emotion-ml": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Emotion ML service unavailable", message: err.message });
    },
  })
);

// Proxy: /therapy-ai/* -> therapy-collab-ai (FastAPI)
app.use(
  "/therapy-ai",
  createProxyMiddleware({
    target: origin(SERVICES.therapyAi),
    changeOrigin: true,
    pathRewrite: { "^/therapy-ai": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Therapy AI service unavailable", message: err.message });
    },
  })
);

// Proxy: /therapy/* -> therapy-collab (Express)
app.use(
  "/therapy",
  createProxyMiddleware({
    target: origin(SERVICES.therapy),
    changeOrigin: true,
    pathRewrite: { "^/therapy": "" },
    onError: (err, req, res) => {
      res.status(502).json({ error: "Therapy collab service unavailable", message: err.message });
    },
  })
);

// Root
app.get("/", (req, res) => {
  res.json({
    name: "Autism Support API Gateway",
    port: PORT,
    docs: "GET /health for gateway and route list",
    routes: {
      "GET /health": "Gateway health and service paths",
      "/profile-builder": "Autism profile builder (Flask)",
      "/cognitive": "Cognitive activity recommender (FastAPI)",
      "/emotional": "Emotional activity recommender (Express)",
      "/emotion-ml": "Emotion ML service (FastAPI)",
      "/therapy-ai": "Therapy collab AI service (FastAPI)",
      "/therapy": "Therapy collab service (Express)",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Gateway running at http://localhost:${PORT}`);
  console.log(`  /profile-builder -> ${SERVICES.profileBuilder}`);
  console.log(`  /cognitive       -> ${SERVICES.cognitive}`);
  console.log(`  /emotional       -> ${SERVICES.emotional}`);
  console.log(`  /emotion-ml      -> ${SERVICES.emotionMl}`);
  console.log(`  /therapy-ai      -> ${SERVICES.therapyAi}`);
  console.log(`  /therapy         -> ${SERVICES.therapy}`);
});
