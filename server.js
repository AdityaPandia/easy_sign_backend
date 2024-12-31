

// server.js

require("pg");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { connectDB, sequelize } = require("./config/db"); // Import sequelize and connectDB

const fs = require("fs");
const path = require("path");
const moment = require("moment"); // For formatting timestamps


// Load environment variables
dotenv.config();

const app = express();

// Connect to database
connectDB();

// Sync models with the database (optional but recommended)
sequelize.sync({ force: false })  // Use force: false to avoid dropping existing tables
  .then(() => {
    console.log("Database synced!");
  })
  .catch(err => {
    console.error("Error syncing database:", err);
  });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/files", require("./routes/fileUploadRoutes")); // Mount file upload routes


const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");


const router = express.Router();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 bucket name
const S3_BUCKET = process.env.S3_BUCKET_NAME;

router.get("/api/uploads/history", async (req, res) => {
  try {
    // List objects in the S3 bucket
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
    });

    const data = await s3.send(command);
    
    // If no files are found
    if (!data.Contents || data.Contents.length === 0) {
      return res.status(404).json({ error: "No files found in S3 bucket" });
    }

    // Get metadata for each file in the S3 bucket
    const uploadHistory = data.Contents.map(file => ({
      fileName: file.Key,
      filePath: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`, // Public URL
      size: file.Size, // Size in bytes
      uploadedAt: moment(file.LastModified).format("YYYY-MM-DD HH:mm:ss"), // Last modified time
    }));

    res.json(uploadHistory);
  } catch (error) {
    console.error("Error fetching upload history from S3:", error);
    res.status(500).json({ error: "Failed to fetch upload history", details: error.message });
  }
});





// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


