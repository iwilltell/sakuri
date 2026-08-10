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

router.use(authenticate);

// Create memory
router.post(
  "/:dreamId/memories",
  createMemory,
);

// Get all memories for a dream
router.get(
  "/:dreamId/memories",
  getMemories,
);

// Get one memory
router.get(
  "/:dreamId/memories/:memoryId",
  getMemory,
);

// Edit memory
router.patch(
  "/:dreamId/memories/:memoryId",
  updateMemory,
);

// Delete memory
router.delete(
  "/:dreamId/memories/:memoryId",
  deleteMemory,
);

export default router;