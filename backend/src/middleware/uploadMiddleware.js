const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");

// Ensure a subdirectory exists and return its path
function ensureDir(subdir) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Create a multer instance for a given subdirectory
function createUpload(subdir, allowPdf = false) {
  const dest = ensureDir(subdir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, req.user._id + "-" + uniqueSuffix + ext);
    }
  });
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
    storage,
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
