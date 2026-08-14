import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../lib/prisma.js";

type AuthenticatedRequest = Request & {
  account?: {
    id: string;
  };
};

function getRequiredText(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const text = value.trim();

  if (!text) {
    throw new Error(`${field} is required.`);
  }

  return text;
}

function getOptionalText(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

// --------------------------------------------------
// CREATE MEMORY
// --------------------------------------------------

export async function createMemory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.account) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const title = getRequiredText(
      req.body.title,
      "Title",
    );

    const description = getOptionalText(
      req.body.description,
    );

    const memory = await prisma.memory.create({
      data: {
        title,
        description,
        accountId: req.account.id,
        memoryDate: new Date(),
      },
    });

    res.status(201).json({
      memory,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// GET ALL MEMORIES
// --------------------------------------------------

export async function getMemories(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.account) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const memories = await prisma.memory.findMany({
      where: {
        accountId: req.account.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      memories,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// GET ONE MEMORY
// --------------------------------------------------

export async function getMemory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.account) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const memoryId = String(
      req.params.memoryId,
    );

    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        accountId: req.account.id,
      },
    });

    if (!memory) {
      res.status(404).json({
        message: "Memory not found.",
      });
      return;
    }

    res.json({
      memory,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// UPDATE MEMORY
// --------------------------------------------------

export async function updateMemory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.account) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const memoryId = String(
      req.params.memoryId,
    );

    const existing = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        accountId: req.account.id,
      },
    });

    if (!existing) {
      res.status(404).json({
        message: "Memory not found.",
      });
      return;
    }

    const title = getRequiredText(
      req.body.title,
      "Title",
    );

    const description = getOptionalText(
      req.body.description,
    );

    const memory = await prisma.memory.update({
      where: {
        id: memoryId,
      },
      data: {
        title,
        description,
        updatedAt: new Date(),
      },
    });

    res.json({
      memory,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// DELETE MEMORY
// --------------------------------------------------

export async function deleteMemory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.account) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const memoryId = String(
      req.params.memoryId,
    );

    const existing = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        accountId: req.account.id,
      },
    });

    if (!existing) {
      res.status(404).json({
        message: "Memory not found.",
      });
      return;
    }

    await prisma.memory.delete({
      where: {
        id: memoryId,
      },
    });

    res.json({
      message: "Memory deleted.",
    });
  } catch (error) {
    next(error);
  }
}