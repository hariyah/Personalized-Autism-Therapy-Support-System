const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5001;
const AI_URL = process.env.AI_URL || "http://localhost:8000/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:8000/analyze-text";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Fail fast on DB queries when MongoDB is unavailable.
mongoose.set("bufferCommands", false);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB (supports both MONGO_URI and MONGODB_URI)
if (MONGO_URI && MONGO_URI !== "YOUR_MONGO_URI") {
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err.message));
} else {
  console.warn("MongoDB URI missing. Set MONGO_URI or MONGODB_URI in backend/services/therapy-collab/.env");
}

// Routes
const authRoutes = require("./routes/auth");
const parentRoutes = require("./routes/parent");
const doctorRoutes = require("./routes/doctor");
const notificationRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "Therapy collab service is running",
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
  console.log(`Therapy collab service running on http://localhost:${PORT}`);
  console.log(`Therapy collab AI URL: ${AI_URL}`);
});
