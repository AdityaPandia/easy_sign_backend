

// // server.js
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const { connectDB, sequelize } = require("./config/db"); // Import sequelize and connectDB

// const fs = require("fs");
// const path = require("path");
// const moment = require("moment"); // For formatting timestamps


// // Load environment variables
// dotenv.config();

// const app = express();

// // Connect to database
// connectDB();

// // Sync models with the database (optional but recommended)
// sequelize.sync({ force: false })  // Use force: false to avoid dropping existing tables
//     .then(() => {
//         console.log("Database synced!");
//     })
//     .catch(err => {
//         console.error("Error syncing database:", err);
//     });

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Routes
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/files", require("./routes/fileUploadRoutes")); // Mount file upload routes
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.get("/api/uploads/history", (req, res) => {
//     const uploadsDir = path.join(__dirname, "uploads");

//     // Read the uploads directory
//     fs.readdir(uploadsDir, (err, files) => {
//         if (err) {
//             console.error("Error reading uploads directory:", err);
//             return res.status(500).json({ error: "Failed to fetch upload history" });
//         }

//         // Get file metadata for each file
//         const uploadHistory = files.map(file => {
//             const filePath = path.join(uploadsDir, file);
//             const stats = fs.statSync(filePath);
//             return {
//                 fileName: file,
//                 filePath: `/uploads/${file}`, // Public URL
//                 size: stats.size, // Size in bytes
//                 uploadedAt: moment(stats.mtime).format("YYYY-MM-DD HH:mm:ss"), // Last modified time
//             };
//         });

//         res.json(uploadHistory);
//     });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


///
//SERVERLESS::

// server.js
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/uploads/history", (req, res) => {
    const uploadsDir = path.join(__dirname, "uploads");

    // Read the uploads directory
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error("Error reading uploads directory:", err);
            return res.status(500).json({ error: "Failed to fetch upload history" });
        }

        // Get file metadata for each file
        const uploadHistory = files.map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return {
                fileName: file,
                filePath: `/uploads/${file}`, // Public URL
                size: stats.size, // Size in bytes
                uploadedAt: moment(stats.mtime).format("YYYY-MM-DD HH:mm:ss"), // Last modified time
            };
        });

        res.json(uploadHistory);
    });
});

// Export the Express app for Vercel to use
module.exports = app;  // This is key for Vercel to handle requests

