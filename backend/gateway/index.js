/**
 * API Gateway - single entry point for backend services.
 * Runs on port 7777. Proxies by path prefix to:
 *   /profile-builder  -> autism-profile-builder (7001)
 *   /cognitive        -> cognitive-activity-recommender (7002)
 *   /emotional        -> emotional-activity-recommender (7003)
 *   /emotion-ml       -> emotional-activity-recommender-ml (7004)
 *   /therapy-ai       -> therapy-collab-ai (7005)
 *   /therapy          -> therapy-collab (7006)
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const PORT = Number(process.env.PORT) || 7777;

const SERVICES = {
  profileBuilder: process.env.PROFILE_BUILDER_URL || "http://localhost:7001",
  cognitive: process.env.COGNITIVE_URL || "http://localhost:7002",
  emotional: process.env.EMOTIONAL_URL || "http://localhost:7003",
  emotionMl: process.env.EMOTION_ML_URL || "http://localhost:7004",
  therapyAi: process.env.THERAPY_AI_URL || "http://localhost:7005",
  therapy: process.env.THERAPY_URL || "http://localhost:7006",
};

const app = express();
app.use(cors());
app.use(express.json());

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
      auth: "/api/auth (login, register -> profile-builder)",
    },
  });
});

// Common auth: /api/auth/* -> autism-profile-builder /api/auth/* (single login/register for all services)
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: SERVICES.profileBuilder,
    changeOrigin: true,
    onError: (err, req, res) => {
      res.status(502).json({ error: "Auth service unavailable", message: err.message });
    },
  })
);

// Proxy: /profile-builder/* -> autism-profile-builder (strip prefix so backend sees /api/...)
app.use(
  "/profile-builder",
  createProxyMiddleware({
    target: SERVICES.profileBuilder,
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
    target: SERVICES.cognitive,
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
    target: SERVICES.emotional,
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
    target: SERVICES.emotionMl,
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
    target: SERVICES.therapyAi,
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
    target: SERVICES.therapy,
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
