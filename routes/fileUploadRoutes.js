const express = require("express");
const upload = require("../controllers/fileUpload");  // Ensure this import is correct
const authenticateUser = require("../middlewares/authenticateUser"); // Correct import
// Import the middleware
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PDFDocument, rgb, StandardFonts  } = require("pdf-lib");
const path = require("path");
const File = require("../models/File");
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());
const router = express.Router();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;

// Helper function to download file from S3
const downloadFromS3 = async (key) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  const response = await s3.send(command); // Using the send() method with the new SDK
  return response.Body.transformToByteArray();
};

// Helper function to upload file to S3
const uploadToS3 = async (key, buffer) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
  };
  const command = new PutObjectCommand(params); // Use the correct command for uploading
  await s3.send(command); // Correct method for the new SDK
};

// Helper function to sign PDF
// const signPdf = async (s3Key, signerName) => {
//   const pdfBytes = await downloadFromS3(s3Key);
//   const pdfDoc = await PDFDocument.load(pdfBytes);
//   const pages = pdfDoc.getPages();
//   const firstPage = pages[0];

//   firstPage.drawText(signerName, {
//     x: 50,
//     y: 50,
//     size: 12,
//     color: rgb(0, 0, 0),
//   });

//   const signedPdfBytes = await pdfDoc.save();
//   const signedKey = `signed_${path.basename(s3Key)}`;
//   await uploadToS3(signedKey, signedPdfBytes);

//   return signedKey;
// };


// Updated helper function to sign PDF
const signPdf = async (s3Key, signerName) => {
  const pdfBytes = await downloadFromS3(s3Key);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (pages.length === 0) {
    throw new Error("The PDF file has no pages to sign.");
  }

  // Get the last page of the PDF
  const lastPage = pages[pages.length - 1];

  // Get the dimensions of the page to calculate the bottom left position
  const { width, height } = lastPage.getSize();
  const x = 10; // 10 units from the left edge
  const y = 30; // 30 units from the bottom edge

  // Add the text "Easy Signed By:" and the signer's name
  lastPage.drawText("Easy Signed By:", {
    x: x,
    y: y + 12, // Offset slightly above the name
    size: 10,
    color: rgb(0, 0, 0),
  });

  lastPage.drawText(signerName, {
    x: x,
    y: y, // Positioned directly below "Easy Signed By:"
    size: 12,
    color: rgb(0, 0, 0),
  });

  // Save the signed PDF
  const signedPdfBytes = await pdfDoc.save();
  const signedKey = `signed_${path.basename(s3Key)}`;
  await uploadToS3(signedKey, signedPdfBytes);

  return signedKey;
};


// File upload route - Add middleware here
router.post("/upload", authenticateUser, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user?.id; // Get the user ID from the request
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const newFile = await File.create({
      fileName: req.file.originalname,
      filePath: req.file.key, // Ensure this is coming from the upload middleware
      userId, // Save the user ID with the file record
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        filePath: req.file.key, // Ensure the correct key is used
        userId: newFile.userId,
        createdAt: newFile.createdAt,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error uploading file", details: error.message });
  }
});

// PDF signing route - Add middleware here as well
router.post("/sign-pdf", authenticateUser, async (req, res) => {
  const { fileId, signerName } = req.body;

  if (!fileId || !signerName) {
    return res.status(400).json({ error: "File ID and signer name are required" });
  }

  try {
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const signedKey = await signPdf(file.filePath, signerName);

    file.signedFilePath = signedKey;
    file.signerName = signerName;
    file.signedAt = new Date();
    await file.save();

    res.status(200).json({ signedFilePath: signedKey });
  } catch (error) {
    console.error("Error signing PDF:", error);
    res.status(500).json({ error: "Error signing the PDF", details: error.message });
  }
});

// Fetch documents route - Add middleware here as well
router.get("/documents", authenticateUser, async (req, res) => {
  try {
    const files = await File.findAll({ where: { userId: req.user.id } });
    const unsigned = files.filter((file) => !file.signedFilePath);
    const signed = files.filter((file) => file.signedFilePath);

    res.status(200).json({
      unsigned,
      signed,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents", details: error.message });
  }
});

//new

// Update the helper function to support image-based PDF signing
const signPdfWithImage = async (s3Key, imageBuffer, x, y, width, height) => {
  // Download the PDF from S3
  const pdfBytes = await downloadFromS3(s3Key);

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Embed the image into the PDF
  const image = await pdfDoc.embedPng(imageBuffer);

  // Get all the pages of the PDF
  const pages = pdfDoc.getPages();

  // Select the last page
  const lastPage = pages[pages.length - 1];

  // Get the dimensions of the last page
  const { width: pageWidth, height: pageHeight } = lastPage.getSize();

  // Set default values for image dimensions
  const scaledImage = image.scale(1); // Default scaling factor
  const imageWidth = width || scaledImage.width;
  const imageHeight = height || scaledImage.height;

  // Calculate placement coordinates for bottom-left corner
  const marginX = 2; // Margin from the left edge
  const marginY = 2; // Margin from the bottom edge
  const adjustedX = x || marginX; // Default X-coordinate with margin
  const adjustedY = y || marginY; // Default Y-coordinate with margin

  // Ensure coordinates are within bounds
  const finalX = Math.max(adjustedX, marginX); // Ensure within page width
  const finalY = Math.max(adjustedY, marginY); // Ensure above bottom margin

  // Set font and size for the text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12; // Adjust font size as needed
  const text = "Easy Signed By:";

  // Calculate text placement
  const textX = finalX; // Align with image X-coordinate
  const textY = finalY + imageHeight + 5; // Place above the image with padding

  // Draw the text on the page
  lastPage.drawText(text, {
    x: textX,
    y: textY,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0), // Black color
  });

  // Draw the image on the last page
  lastPage.drawImage(image, {
    x: finalX,
    y: finalY,
    width: imageWidth,
    height: imageHeight,
  });

  // Save the modified PDF
  const signedPdfBytes = await pdfDoc.save();

  // Generate a new S3 key for the signed PDF
  const signedKey = `signed_${path.basename(s3Key)}`;

  // Upload the signed PDF to S3
  await uploadToS3(signedKey, signedPdfBytes);

  return signedKey;
};

// Add a new API endpoint for signing the PDF with an image

router.post("/sign-pdf-with-image", authenticateUser, upload.single("signatureImage"), async (req, res) => {
  const { fileId, x, y, width, height } = req.body;

  if (!fileId || !req.file) {
    return res.status(400).json({ error: "File ID and signature image are required" });
  }

  try {
    // Fetch the file record from the database
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Download the file from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: req.file.key, // Key from multerS3
    };

    const command = new GetObjectCommand(params);
    const response = await s3.send(command);

    // Read the data from the response.Body stream
    const streamToBuffer = async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };
    const imageBuffer = await streamToBuffer(response.Body);

    // Sign the PDF with the uploaded image
    const signedKey = await signPdfWithImage(
      file.filePath,
      imageBuffer,
       parseFloat(x) || 50,  // Default to 50 if the value is not a valid number
     parseFloat(y) || 50,
   parseFloat(width) || 100,
     parseFloat(height) || 50
    );

    // Update the file record with signed PDF information
    file.signedFilePath = signedKey;
    file.signedAt = new Date();
    await file.save();

    res.status(200).json({ signedFilePath: signedKey });
  } catch (error) {
    console.error("Error signing PDF with image:", error);
    res.status(500).json({ error: "Error signing the PDF with image", details: error.message });
  }
});




//till here



module.exports = router;
