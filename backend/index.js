require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const AI_URL = process.env.AI_URL || "http://localhost:8000/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:8000/analyze-text";
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB (if MONGO_URI is set)
if (MONGO_URI && MONGO_URI !== "YOUR_MONGO_URI") {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✓ MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));
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
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Analyze voice endpoint - forwards audio to AI service
app.post("/api/analyze", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    // Create FormData to send to AI service
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    // Forward to AI service
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

    // Forward to AI service
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

// Start server
app.listen(PORT, () => {
  console.log(`✓ Express server running on http://localhost:${PORT}`);
  console.log(`✓ AI Service URL: ${AI_URL}`);
});
