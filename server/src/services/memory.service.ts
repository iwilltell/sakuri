import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { cloudinary } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

type AuthenticatedRequest = Request & {
  account?: {
    id: string;
  };
};

type UploadedFile = Express.Multer.File;

function getRequiredText(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string") {
    throw new Error(
      `${field} is required.`,
    );
  }

  const text = value.trim();

  if (!text) {
    throw new Error(
      `${field} is required.`,
    );
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
// CLOUDINARY UPLOAD
// --------------------------------------------------

function uploadMemoryImage(
  buffer: Buffer,
): Promise<{
  secure_url: string;
  public_id: string;
}> {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder: "sakuri/memories",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(
                error ??
                  new Error(
                    "Image upload failed.",
                  ),
              );

              return;
            }

            resolve({
              secure_url:
                result.secure_url,
              public_id:
                result.public_id,
            });
          },
        );

      stream.end(buffer);
    },
  );
}

// --------------------------------------------------
// CLOUDINARY DELETE
// --------------------------------------------------

async function deleteCloudinaryImage(
  publicId: string,
) {
  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      },
    );
  } catch (error) {
    console.error(
      "Unable to delete Cloudinary image:",
      error,
    );
  }
}

// --------------------------------------------------
// CREATE MEMORY
// --------------------------------------------------

export async function createMemory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const uploadedPublicIds: string[] = [];

  try {
    if (!req.account) {
      res.status(401).json({
        message:
          "Authentication required.",
      });

      return;
    }

    const title =
      getRequiredText(
        req.body.title,
        "Title",
      );

    const description =
      getOptionalText(
        req.body.description,
      );

    const files =
      (req.files as UploadedFile[]) ??
      [];

    // ----------------------------------------------
    // Create memory first
    // ----------------------------------------------

    const memory =
      await prisma.memory.create({
        data: {
          title,
          description,
          accountId:
            req.account.id,
        },
      });

    // ----------------------------------------------
    // Upload images
    // ----------------------------------------------

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file = files[index];

      const uploaded =
        await uploadMemoryImage(
          file.buffer,
        );

      uploadedPublicIds.push(
        uploaded.public_id,
      );

      await prisma.memoryImage.create({
        data: {
          memoryId: memory.id,
          url: uploaded.secure_url,
          publicId:
            uploaded.public_id,
          sortOrder: index,
        },
      });
    }

    // ----------------------------------------------
    // Return complete memory
    // ----------------------------------------------

    const completeMemory =
      await prisma.memory.findUnique({
        where: {
          id: memory.id,
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

    res.status(201).json({
      memory: completeMemory,
    });
  } catch (error) {
    // Clean up Cloudinary uploads if
    // database creation fails later.
    await Promise.all(
      uploadedPublicIds.map(
        deleteCloudinaryImage,
      ),
    );

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
        message:
          "Authentication required.",
      });

      return;
    }

    const memories =
      await prisma.memory.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
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
        message:
          "Authentication required.",
      });

      return;
    }

    const memoryId =
      String(req.params.memoryId);

    const memory =
      await prisma.memory.findUnique({
        where: {
          id: memoryId,
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

    if (!memory) {
      res.status(404).json({
        message:
          "Memory not found.",
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
  const uploadedPublicIds: string[] = [];

  try {
    if (!req.account) {
      res.status(401).json({
        message:
          "Authentication required.",
      });

      return;
    }

    const memoryId =
      String(req.params.memoryId);

    const existing =
      await prisma.memory.findUnique({
        where: {
          id: memoryId,
        },

        include: {
          images: true,
        },
      });

    if (!existing) {
      res.status(404).json({
        message:
          "Memory not found.",
      });

      return;
    }

    const title =
      getRequiredText(
        req.body.title,
        "Title",
      );

    const description =
      getOptionalText(
        req.body.description,
      );

    // ----------------------------------------------
    // Update text
    // ----------------------------------------------

    await prisma.memory.update({
      where: {
        id: memoryId,
      },

      data: {
        title,
        description,
        updatedAt: new Date(),
      },
    });

    // ----------------------------------------------
    // Remove selected images
    // ----------------------------------------------

    let removeImageIds: string[] = [];

    if (
      typeof req.body.removeImageIds ===
      "string"
    ) {
      try {
        const parsed =
          JSON.parse(
            req.body.removeImageIds,
          );

        if (
          Array.isArray(parsed)
        ) {
          removeImageIds =
            parsed.filter(
              (id): id is string =>
                typeof id === "string",
            );
        }
      } catch {
        throw new Error(
          "Invalid image removal data.",
        );
      }
    }

    if (
      removeImageIds.length > 0
    ) {
      const imagesToRemove =
        existing.images.filter(
          (image) =>
            removeImageIds.includes(
              image.id,
            ),
        );

      await prisma.memoryImage.deleteMany(
        {
          where: {
            id: {
              in: imagesToRemove.map(
                (image) => image.id,
              ),
            },

            memoryId,
          },
        },
      );

      await Promise.all(
        imagesToRemove.map(
          (image) =>
            deleteCloudinaryImage(
              image.publicId,
            ),
        ),
      );
    }

    // ----------------------------------------------
    // Add new images
    // ----------------------------------------------

    const files =
      (req.files as UploadedFile[]) ??
      [];

    const remainingImages =
      await prisma.memoryImage.count({
        where: {
          memoryId,
        },
      });

    if (
      remainingImages +
        files.length >
      10
    ) {
      throw new Error(
        "A memory can have a maximum of 10 images.",
      );
    }

    let nextSortOrder =
      remainingImages;

    for (const file of files) {
      const uploaded =
        await uploadMemoryImage(
          file.buffer,
        );

      uploadedPublicIds.push(
        uploaded.public_id,
      );

      await prisma.memoryImage.create({
        data: {
          memoryId,
          url: uploaded.secure_url,
          publicId:
            uploaded.public_id,
          sortOrder:
            nextSortOrder++,
        },
      });
    }

    // ----------------------------------------------
    // Return complete memory
    // ----------------------------------------------

    const updatedMemory =
      await prisma.memory.findUnique({
        where: {
          id: memoryId,
        },

        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

    res.json({
      memory: updatedMemory,
    });
  } catch (error) {
    await Promise.all(
      uploadedPublicIds.map(
        deleteCloudinaryImage,
      ),
    );

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
        message:
          "Authentication required.",
      });

      return;
    }

    const memoryId =
      String(req.params.memoryId);

    const existing =
      await prisma.memory.findUnique({
        where: {
          id: memoryId,
        },

        include: {
          images: true,
        },
      });

    if (!existing) {
      res.status(404).json({
        message:
          "Memory not found.",
      });

      return;
    }

    // Delete database record.
    await prisma.memory.delete({
      where: {
        id: memoryId,
      },
    });

    // Delete associated Cloudinary images.
    await Promise.all(
      existing.images.map(
        (image) =>
          deleteCloudinaryImage(
            image.publicId,
          ),
      ),
    );

    res.json({
      message:
        "Memory deleted.",
    });
  } catch (error) {
    next(error);
  }
}