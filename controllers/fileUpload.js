const multer = require("multer");
const path = require("path");

// Define storage for the files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the upload folder
    cb(null, "tmp/");
  },
  filename: (req, file, cb) => {
    // Ensure the file name is unique using Date.now
    cb(null, Date.now() + path.extname(file.originalname)); // Adds file extension
  }
});

// Set file size limit (optional)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
  fileFilter: (req, file, cb) => {
    // Only allow doc, docx, pdf file types
    const filetypes = /doc|docx|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only .doc, .docx, and .pdf files are allowed."));
  }
});

// Export the upload middleware
module.exports = upload;
