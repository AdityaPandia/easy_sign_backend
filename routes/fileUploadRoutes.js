const express = require("express");
const upload = require("../controllers/fileUpload");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PDFDocument, rgb } = require("pdf-lib");
const path = require("path");
const File = require("../models/File");

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
const signPdf = async (s3Key, signerName) => {
  const pdfBytes = await downloadFromS3(s3Key);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  firstPage.drawText(signerName, {
    x: 50,
    y: 50,
    size: 12,
    color: rgb(0, 0, 0),
  });

  const signedPdfBytes = await pdfDoc.save();
  const signedKey = `signed_${path.basename(s3Key)}`;
  await uploadToS3(signedKey, signedPdfBytes);

  return signedKey;
};

// File upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const newFile = await File.create({
      fileName: req.file.originalname,
      filePath: req.file.key,
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        filePath: req.file.key,
        createdAt: newFile.createdAt,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error uploading file", details: error.message });
  }
});

// PDF signing route
router.post("/sign-pdf", async (req, res) => {
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
    await file.save();

    res.status(200).json({ signedFilePath: signedKey });
  } catch (error) {
    console.error("Error signing PDF:", error);
    res.status(500).json({ error: "Error signing the PDF", details: error.message });
  }
});

// Fetch documents route
router.get("/documents", async (req, res) => {
  try {
    const files = await File.findAll();
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

module.exports = router;
