const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 5000;
const THERAPY_COLLAB_URL = process.env.THERAPY_COLLAB_URL || "http://localhost:5001";

app.use(cors());

app.get("/health", (req, res) => {
  res.json({
    status: "Gateway is running",
    target: THERAPY_COLLAB_URL,
    timestamp: new Date().toISOString(),
  });
});

app.use(
  "/service-health",
  createProxyMiddleware({
    target: THERAPY_COLLAB_URL,
    changeOrigin: true,
    pathRewrite: () => "/health",
  })
);

app.use(
  "/api",
  createProxyMiddleware({
    target: THERAPY_COLLAB_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api${path}`,
  })
);

app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  console.log(`Proxy target: ${THERAPY_COLLAB_URL}`);
});
