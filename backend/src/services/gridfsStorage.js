const path = require("path");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongoose").mongo;

function getBucket(bucketName) {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error("Database storage is not ready yet");
    err.code = "GRIDFS_NOT_READY";
    throw err;
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName });
}

/**
 * Multer storage engine that persists files in MongoDB GridFS instead of the
 * local disk. Render (and other ephemeral hosts) wipe the filesystem on every
 * restart/redeploy, which made uploaded documents disappear. Storing in Mongo
 * keeps files available for the admin dashboard.
 *
 * The stored URL keeps the original extension so callers can detect image vs
 * PDF from the URL, e.g. /uploads/verification/<id>.jpg
 */
function gridFsStorage({ bucketName }) {
  return {
    _handleFile(req, file, cb) {
      let bucket;
      try {
        bucket = getBucket(bucketName);
      } catch (err) {
        return cb(err);
      }

      const id = new mongoose.Types.ObjectId();
      const ext = path.extname(file.originalname) || "";
      const filename = `${id.toString()}${ext}`;

      const uploadStream = bucket.openUploadStreamWithId(id, filename, {
        contentType: file.mimetype || "application/octet-stream",
        metadata: {
          userId: req.user?._id ? String(req.user._id) : undefined,
          originalName: file.originalname,
          uploadedAt: new Date(),
        },
      });

      file.stream
        .pipe(uploadStream)
        .on("error", cb)
        .on("finish", () =>
          cb(null, {
            filename,
            size: uploadStream.length,
            path: `/uploads/${bucketName}/${filename}`,
          }),
        );
    },

    _removeFile(req, file, cb) {
      try {
        const bucket = getBucket(bucketName);
        const id = String(file.filename || "").split(".")[0];
        if (mongoose.Types.ObjectId.isValid(id)) {
          bucket.delete(new mongoose.Types.ObjectId(id), (err) => cb(err));
        } else {
          cb(null);
        }
      } catch (err) {
        cb(err);
      }
    },
  };
}

/**
 * Express handler that streams a GridFS file for /uploads/<bucket>/<id>[.ext].
 * Calls next() when the file is not in GridFS so the static-file middleware can
 * serve legacy files that were stored on disk.
 */
async function streamGridFsFile(req, res, next) {
  const { subdir, fileId } = req.params;
  try {
    if (!subdir || !fileId) return next();
    const idPart = String(fileId).split(".")[0];
    if (!mongoose.Types.ObjectId.isValid(idPart)) return next();
    if (mongoose.connection.readyState !== 1) return next();

    const bucket = getBucket(subdir);
    const files = await bucket
      .find({ _id: new mongoose.Types.ObjectId(idPart) })
      .toArray();
    if (!files.length) return next();

    const file = files[0];
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Length", String(file.length));
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    bucket.openDownloadStream(file._id).pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { gridFsStorage, streamGridFsFile, getBucket };
