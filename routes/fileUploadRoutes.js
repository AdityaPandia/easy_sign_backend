// const express = require("express");
// const upload = require("../controllers/fileUpload");
// const fs = require("fs");
// const path = require("path");
// const { PDFDocument, rgb } = require("pdf-lib");
// const File = require("../models/File"); // Import the File model
// const router = express.Router();

// // Helper function to sign PDF
// const signPdf = async (filePath, signerName, uploadsDir) => {
//   try {
//     const pdfPath = path.join(__dirname, "../" + filePath); // Correct path resolution
//     const existingPdfBytes = fs.readFileSync(pdfPath);

//     const pdfDoc = await PDFDocument.load(existingPdfBytes);

//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     // Set the signer name text on the PDF
//     firstPage.drawText(signerName, {
//       x: 50,
//       y: 50,
//       size: 12,
//       color: rgb(0, 0, 0),
//     });

//     const signedPdfBytes = await pdfDoc.save();
//     const signedFilePath = path.join(uploadsDir, "signed_" + path.basename(filePath));
//     fs.writeFileSync(signedFilePath, signedPdfBytes);

//     return `/tmp/${path.basename(signedFilePath)}`;
//   } catch (error) {
//     throw new Error("Error signing the PDF: " + error.message);
//   }
// };


// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send({ error: "No file uploaded" });
//     }

//     // Save file information to the database
//     const newFile = await File.create({
//       fileName: req.file.filename,
//       filePath: `/tmp/${req.file.filename}`,
//     });

//     // Return only the necessary fields in the response
//     res.status(200).json({
//       message: "File uploaded successfully",
//       file: {
//         id: newFile.id,
//         fileName: newFile.fileName,
//         filePath: newFile.filePath,
//         createdAt: newFile.createdAt, // Include the timestamp
//       },
//     });
//   } catch (error) {
//     res.status(500).send({ error: "Error uploading file", details: error.message });
//   }
// });


// // Route to sign a PDF
// router.post("/sign-pdf", async (req, res) => {
//   const { fileId, signerName } = req.body;

//   if (!fileId || !signerName) {
//     return res.status(400).send({ error: "File ID and signer name are required" });
//   }

//   try {
//     const file = await File.findByPk(fileId);
//     if (!file) {
//       return res.status(404).send({ error: "File not found" });
//     }

//     const uploadsDir = path.join(__dirname, "../tmp");
//     const signedFilePath = await signPdf(file.filePath, signerName, uploadsDir);

//     file.signedFilePath = signedFilePath;
//     file.signerName = signerName;
//     await file.save();

//     res.json({ signedFilePath });
//   } catch (err) {
//     console.error("Error signing PDF:", err);
//     res.status(500).send({ error: "Error signing the PDF", details: err.message });
//   }
// });

// // Route to get all documents (unsigned and signed)
// router.get("/documents", async (req, res) => {
//   try {
//     // Fetch all files from the database
//     const files = await File.findAll();

//     // Separate unsigned and signed documents based on the database properties
//     const unsigned = files.filter(file => !file.signedFilePath);
//     const signed = files.filter(file => file.signedFilePath);

//     res.status(200).json({
//       unsigned: unsigned,
//       signed: signed,
//     });
//   } catch (error) {
//     res.status(500).send({ error: "Failed to fetch documents", details: error.message });
//   }
// });

// module.exports = router;







const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { PDFDocument, rgb } = require("pdf-lib");
const File = require("../models/File"); // Import the File model
const upload = require("../controllers/fileUpload");
const router = express.Router();

// Helper function to sign PDF
const signPdf = async (filePath, signerName, uploadsDir) => {
  try {
    const pdfPath = path.join(os.tmpdir(), filePath); // Adjust path to temp directory
    const existingPdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Set the signer name text on the PDF
    firstPage.drawText(signerName, {
      x: 50,
      y: 50,
      size: 12,
      color: rgb(0, 0, 0),
    });

    const signedPdfBytes = await pdfDoc.save();
    const signedFilePath = path.join(uploadsDir, "signed_" + path.basename(filePath));
    fs.writeFileSync(signedFilePath, signedPdfBytes);

    return `/tmp/${path.basename(signedFilePath)}`;
  } catch (error) {
    throw new Error("Error signing the PDF: " + error.message);
  }
};

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const uploadsDir = os.tmpdir(); // Use temp directory
    const filePath = path.join(uploadsDir, req.file.filename);

    // Save the file to the temp directory
    fs.writeFileSync(filePath, req.file.buffer);

    // Save file information to the database
    const newFile = await File.create({
      fileName: req.file.filename,
      filePath: `/tmp/${req.file.filename}`,
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        filePath: newFile.filePath,
        createdAt: newFile.createdAt,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send({ error: "Error uploading file", details: error.message });
  }
});

// Other routes remain unchanged
module.exports = router;
