/**
 * Multer upload middleware. Files get generated "<uuid><ext>" names (the client name is
 * kept only for display), extensions are allow-listed, and the file's magic bytes must
 * match its extension.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { HttpError } = require('../lib/httpError');
const { asyncHandler } = require('../lib/asyncHandler');
const files = require('../lib/files');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images');
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const MB = 1024 * 1024;

function makeUploader({ dir, extensions, maxBytes, label }) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => cb(null, `${uuid()}${files.allowedExtension(file.originalname, extensions)}`),
    }),
    limits: { fileSize: maxBytes, files: 1, fields: 30, fieldSize: 20 * 1024 },
    fileFilter: (req, file, cb) => {
      if (files.allowedExtension(file.originalname, extensions)) return cb(null, true);
      return cb(new HttpError(400, `${label} quyidagi formatlardan birida boʻlishi kerak: ${extensions.join(', ')}`));
    },
  });
}

const resumeUploader = makeUploader({ dir: UPLOAD_ROOT, extensions: files.RESUME_EXTENSIONS, maxBytes: 10 * MB, label: 'Resume' });
const imageUploader = makeUploader({ dir: IMAGE_DIR, extensions: files.IMAGE_EXTENSIONS, maxBytes: 5 * MB, label: 'Image' });

/** Deletes an uploaded file, ignoring failures. */
function removeFile(filePath) {
  if (filePath) fs.promises.unlink(filePath).catch(() => {});
}

/** Rejects (and deletes) an upload whose content does not match its extension. */
const verifySignature = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const handle = await fs.promises.open(req.file.path, 'r');
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    const ext = path.extname(req.file.filename).toLowerCase();
    if (!files.signatureMatches(ext, head)) {
      removeFile(req.file.path);
      throw new HttpError(400, `Yuklangan fayl yaroqli ${ext.slice(1).toUpperCase()} fayli emas`);
    }
  } finally {
    await handle.close();
  }
  return next();
});

/** @param {string} field multipart field name */
const resumeUpload = (field = 'resume') => [resumeUploader.single(field), verifySignature];
/** @param {string} field multipart field name */
const imageUpload = (field) => [imageUploader.single(field), verifySignature];

/** Public URL of an uploaded image file. */
const imageUrlFor = (filename) => `/uploads/images/${filename}`;
/** Public URL of an uploaded resume file. */
const resumeUrlFor = (filename) => `/uploads/${filename}`;

/** Removes a previously stored image given its public URL (only files we generated). */
function removeImageByUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/images/')) return;
  const name = url.slice('/uploads/images/'.length);
  if (files.isGeneratedFilename(name)) removeFile(path.join(IMAGE_DIR, name));
}

module.exports = {
  UPLOAD_ROOT, resumeUpload, imageUpload, imageUrlFor, resumeUrlFor, removeFile, removeImageByUrl,
};
