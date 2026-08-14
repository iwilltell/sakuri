import { Router } from "express";
import multer from "multer";

import { authenticate } from "../middleware/authenticate.js";

import {
  createMemory,
  getMemories,
  getMemory,
  updateMemory,
  deleteMemory,
} from "../services/memory.service.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback,
  ) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.mimetype,
      )
    ) {
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

router.use(authenticate);

// --------------------------------------------------
// CREATE MEMORY
// --------------------------------------------------

router.post(
  "/",
  upload.array("images", 10),
  createMemory,
);

// --------------------------------------------------
// GET ALL MEMORIES
// --------------------------------------------------

router.get(
  "/",
  getMemories,
);

// --------------------------------------------------
// GET ONE MEMORY
// --------------------------------------------------

router.get(
  "/:memoryId",
  getMemory,
);

// --------------------------------------------------
// UPDATE MEMORY
// --------------------------------------------------

router.patch(
  "/:memoryId",
  upload.array("images", 10),
  updateMemory,
);

// --------------------------------------------------
// DELETE MEMORY
// --------------------------------------------------

router.delete(
  "/:memoryId",
  deleteMemory,
);

export default router;