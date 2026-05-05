const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 7005;
const AI_URL = process.env.AI_URL || "http://localhost:7006/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:7006/analyze-text";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const MONGO_RETRY_MS = Number(process.env.MONGO_RETRY_MS || 5000);

// Fail fast on DB queries when MongoDB is unavailable.
mongoose.set("bufferCommands", false);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

let mongoRetryTimer = null;
let mongoConnectAttempt = 0;

function scheduleMongoReconnect(reason) {
  if (!MONGO_URI || MONGO_URI === "YOUR_MONGO_URI" || mongoRetryTimer) {
    return;
  }

  console.warn(
    `${reason}. Retrying MongoDB connection in ${Math.round(MONGO_RETRY_MS / 1000)}s...`
  );

  mongoRetryTimer = setTimeout(() => {
    mongoRetryTimer = null;
    connectToMongo();
  }, MONGO_RETRY_MS);
}

async function connectToMongo() {
  if (!MONGO_URI || MONGO_URI === "YOUR_MONGO_URI") {
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  mongoConnectAttempt += 1;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    scheduleMongoReconnect(`MongoDB connection error (attempt ${mongoConnectAttempt}): ${err.message}`);
  }
}

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  scheduleMongoReconnect("MongoDB disconnected");
});

// Connect to MongoDB (supports both MONGO_URI and MONGODB_URI)
if (MONGO_URI && MONGO_URI !== "YOUR_MONGO_URI") {
  connectToMongo();
} else {
  console.warn("MongoDB URI missing. Set MONGO_URI or MONGODB_URI in server/.env");
}

// Routes
const authRoutes = require("./routes/auth");
const parentRoutes = require("./routes/parent");
const doctorRoutes = require("./routes/doctor");
const notificationRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");
const activitiesRoutes = require("./routes/activities");
const emotionRoutes = require("./routes/emotion");

app.use("/api/auth", authRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/emotion", emotionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date(),
    mongoState: mongoose.connection.readyState,
  });
});

// Analyze voice endpoint - forwards audio to AI service
app.post("/api/analyze", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await axios.post(AI_URL, formData, {
      headers: formData.getHeaders
        ? formData.getHeaders()
        : {
            "Content-Type": "multipart/form-data",
          },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error analyzing audio:", error.message);
    res.status(500).json({
      error: "Failed to analyze audio",
      message: error.message,
    });
  }
});

// Analyze text endpoint - forwards text to AI service
app.post("/api/analyze-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await axios.post(AI_TEXT_URL, { text });
    res.json(response.data);
  } catch (error) {
    console.error("Error analyzing text:", error.message);
    res.status(500).json({
      error: "Failed to analyze text",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`AI Service URL: ${AI_URL}`);
});
