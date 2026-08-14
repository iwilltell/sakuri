import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";

import {
  createMemory,
  getMemories,
  getMemory,
  updateMemory,
  deleteMemory,
} from "../services/memory.service.js";

const router = Router();

// All memory routes require login.
router.use(authenticate);

// --------------------------------------------------
// CREATE MEMORY
// POST /api/memories
// --------------------------------------------------

router.post(
  "/",
  createMemory,
);

// --------------------------------------------------
// GET ALL MEMORIES
// GET /api/memories
// --------------------------------------------------

router.get(
  "/",
  getMemories,
);

// --------------------------------------------------
// GET ONE MEMORY
// GET /api/memories/:memoryId
// --------------------------------------------------

router.get(
  "/:memoryId",
  getMemory,
);

// --------------------------------------------------
// UPDATE MEMORY
// PATCH /api/memories/:memoryId
// --------------------------------------------------

router.patch(
  "/:memoryId",
  updateMemory,
);

// --------------------------------------------------
// DELETE MEMORY
// DELETE /api/memories/:memoryId
// --------------------------------------------------

router.delete(
  "/:memoryId",
  deleteMemory,
);

export default router;