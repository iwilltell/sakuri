import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage = multer.memoryStorage();

export const uploadDreamImages = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new Error(
          "Only JPG, PNG and WebP images are allowed.",
        ),
      );

      return;
    }

    callback(null, true);
  },
});