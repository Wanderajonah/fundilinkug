const multer = require("multer");
const path = require("path");
const { gridFsStorage } = require("../services/gridfsStorage");

// Create a multer instance for a given subdirectory. Files are stored in
// MongoDB GridFS (durable across restarts/redeploys) instead of the local disk.
function createUpload(subdir, allowPdf = false) {
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const isImage = allowedImageTypes.test(ext) && file.mimetype.startsWith("image/");
    const isPdf = allowPdf && ext === ".pdf" && file.mimetype === "application/pdf";
    if (isImage || isPdf) {
      cb(null, true);
    } else {
      const msg = allowPdf
        ? "Only image and PDF files are allowed"
        : "Only image files are allowed (jpeg, jpg, png, gif, webp)";
      cb(new Error(msg));
    }
  };
  return multer({
    storage: gridFsStorage({ bucketName: subdir }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
  });
}

// Pre-built instances
const uploadProfile = createUpload("profiles");
const uploadChat = createUpload("chat");
const uploadBooking = createUpload("bookings");
const uploadPortfolio = createUpload("portfolio");
const uploadVerification = createUpload("verification", true);

module.exports = { uploadProfile, uploadChat, uploadBooking, uploadPortfolio, uploadVerification, createUpload };
