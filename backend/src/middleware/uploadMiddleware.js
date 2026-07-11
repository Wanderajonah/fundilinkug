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
function createUpload(subdir) {
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
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
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

module.exports = { uploadProfile, uploadChat, uploadBooking, createUpload };
