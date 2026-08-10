import { Router } from "express";
import type { UploadApiResponse } from "cloudinary";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

import { prisma } from "../lib/prisma.js";
import { cloudinary } from "../lib/cloudinary.js";
import { uploadDreamImages } from "../lib/upload.js";

const router = Router();

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function uploadToCloudinary(
  buffer: Buffer,
): Promise<UploadApiResponse> {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder: "sakuri/dreams",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary upload failed.",
                ),
              );
              return;
            }

            resolve(result);
          },
        );

      stream.end(buffer);
    },
  );
}

async function deleteFromCloudinary(
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
      "Cloudinary delete failed:",
      error,
    );
  }
}

function parseBoolean(
  value: unknown,
): boolean | undefined {
  if (value === true || value === "true") {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return undefined;
}

function parseRemoveImageIds(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string",
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string",
    );
  } catch {
    return [];
  }
}

// --------------------------------------------------
// GET ALL DREAMS
// --------------------------------------------------

router.get(
  "/",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const accountId =
        req.account.id;

      const dreams =
        await prisma.dream.findMany({
          where: {
            OR: [
              {
                visibility:
                  "SHARED",
              },
              {
                accountId,
              },
            ],
          },

          include: {
            images: {
              orderBy: {
                sortOrder:
                  "asc",
              },
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

      res.json({
        dreams,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// GET ONE DREAM
// --------------------------------------------------

router.get(
  "/:id",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const accountId =
        req.account.id;

      const dreamId =
        String(req.params.id);

      const dream =
        await prisma.dream.findFirst({
          where: {
            id: dreamId,

            OR: [
              {
                visibility:
                  "SHARED",
              },
              {
                accountId,
              },
            ],
          },

          include: {
            images: {
              orderBy: {
                sortOrder:
                  "asc",
              },
            },
          },
        });

      if (!dream) {
        res.status(404).json({
          message:
            "Dream not found.",
        });

        return;
      }

      res.json({
        dream,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// CREATE DREAM
//
// Form fields:
// title
// description
// isPrivate
// images[]          optional
// --------------------------------------------------

router.post(
  "/",
  requireAuth,
  uploadDreamImages.array(
    "images",
    10,
  ),
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    const uploadedPublicIds: string[] =
      [];

    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const accountId =
        req.account.id;

      const title =
        typeof req.body.title ===
        "string"
          ? req.body.title.trim()
          : "";

      const description =
        typeof req.body.description ===
        "string"
          ? req.body.description.trim()
          : null;

      if (!title) {
        res.status(400).json({
          message:
            "Dream title is required.",
        });

        return;
      }

      if (title.length > 200) {
        res.status(400).json({
          message:
            "Dream title must be 200 characters or fewer.",
        });

        return;
      }

      if (
        description !== null &&
        description.length > 5000
      ) {
        res.status(400).json({
          message:
            "Dream description must be 5000 characters or fewer.",
        });

        return;
      }

      const isPrivate =
        parseBoolean(
          req.body.isPrivate,
        ) ?? false;

      const files =
        (req.files as Express.Multer.File[] | undefined) ??
        [];

      const uploadedImages: {
        url: string;
        publicId: string;
        sortOrder: number;
      }[] = [];

      // ----------------------------------------------
      // Upload images first
      // ----------------------------------------------

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const result =
          await uploadToCloudinary(
            files[index].buffer,
          );

        uploadedPublicIds.push(
          result.public_id,
        );

        uploadedImages.push({
          url: result.secure_url,
          publicId:
            result.public_id,
          sortOrder: index,
        });
      }

      // ----------------------------------------------
      // Create database record
      // ----------------------------------------------

      const dream =
        await prisma.dream.create({
          data: {
            title,

            description:
              description || null,

            // Dreams are shared by default.
            visibility: isPrivate
              ? "PRIVATE"
              : "SHARED",

            accountId,

            images:
              uploadedImages.length > 0
                ? {
                    create:
                      uploadedImages,
                  }
                : undefined,
          },

          include: {
            images: {
              orderBy: {
                sortOrder:
                  "asc",
              },
            },
          },
        });

      res.status(201).json({
        dream,
      });
    } catch (error) {
      // If database creation fails after
      // Cloudinary uploads, clean them up.
      await Promise.all(
        uploadedPublicIds.map(
          (publicId) =>
            deleteFromCloudinary(
              publicId,
            ),
        ),
      );

      next(error);
    }
  },
);

// --------------------------------------------------
// UPDATE DREAM
//
// Form fields:
// title              optional
// description        optional
// isPrivate          optional
// removeImageIds     JSON array optional
// images[]           optional new images
// --------------------------------------------------

router.patch(
  "/:id",
  requireAuth,
  uploadDreamImages.array(
    "images",
    10,
  ),
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    const uploadedPublicIds: string[] =
      [];

    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const accountId =
        req.account.id;

      const dreamId =
        String(req.params.id);

      const existing =
        await prisma.dream.findUnique({
          where: {
            id: dreamId,
          },

          include: {
            images: true,
          },
        });

      if (!existing) {
        res.status(404).json({
          message:
            "Dream not found.",
        });

        return;
      }

      // Only owner can edit.
      if (
        existing.accountId !==
        accountId
      ) {
        res.status(403).json({
          message:
            "Only the dream owner can edit this dream.",
        });

        return;
      }

      const data: {
        title?: string;
        description?: string | null;
        visibility?:
          | "SHARED"
          | "PRIVATE";
      } = {};

      // ----------------------------------------------
      // Title
      // ----------------------------------------------

      if (
        typeof req.body.title ===
        "string"
      ) {
        const title =
          req.body.title.trim();

        if (!title) {
          res.status(400).json({
            message:
              "Dream title is required.",
          });

          return;
        }

        if (title.length > 200) {
          res.status(400).json({
            message:
              "Dream title must be 200 characters or fewer.",
          });

          return;
        }

        data.title = title;
      }

      // ----------------------------------------------
      // Description
      // ----------------------------------------------

      if (
        typeof req.body.description ===
        "string"
      ) {
        const description =
          req.body.description.trim();

        if (
          description.length >
          5000
        ) {
          res.status(400).json({
            message:
              "Dream description must be 5000 characters or fewer.",
          });

          return;
        }

        data.description =
          description || null;
      }

      // ----------------------------------------------
      // Privacy
      // ----------------------------------------------

      const privacy =
        parseBoolean(
          req.body.isPrivate,
        );

      if (
        privacy !== undefined
      ) {
        data.visibility =
          privacy
            ? "PRIVATE"
            : "SHARED";
      }

      // ----------------------------------------------
      // Images to remove
      // ----------------------------------------------

      const removeImageIds =
        parseRemoveImageIds(
          req.body.removeImageIds,
        );

      const imagesToRemove =
        existing.images.filter(
          (image) =>
            removeImageIds.includes(
              image.id,
            ),
        );

      // ----------------------------------------------
      // New images
      // ----------------------------------------------

      const files =
        (req.files as Express.Multer.File[] | undefined) ??
        [];

      const uploadedImages: {
        url: string;
        publicId: string;
        sortOrder: number;
      }[] = [];

      const remainingImages =
        existing.images.filter(
          (image) =>
            !removeImageIds.includes(
              image.id,
            ),
        );

      const startingSortOrder =
        remainingImages.length;

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const result =
          await uploadToCloudinary(
            files[index].buffer,
          );

        uploadedPublicIds.push(
          result.public_id,
        );

        uploadedImages.push({
          url: result.secure_url,
          publicId:
            result.public_id,
          sortOrder:
            startingSortOrder +
            index,
        });
      }

      // ----------------------------------------------
      // Update database
      // ----------------------------------------------

      const dream =
        await prisma.$transaction(
          async (tx) => {
            if (
              imagesToRemove.length >
              0
            ) {
              await tx.dreamImage.deleteMany(
                {
                  where: {
                    id: {
                      in: imagesToRemove.map(
                        (image) =>
                          image.id,
                      ),
                    },
                  },
                },
              );
            }

            if (
              uploadedImages.length >
              0
            ) {
              await tx.dreamImage.createMany(
                {
                  data:
                    uploadedImages.map(
                      (image) => ({
                        dreamId,
                        url: image.url,
                        publicId:
                          image.publicId,
                        sortOrder:
                          image.sortOrder,
                      }),
                    ),
                },
              );
            }

            return tx.dream.update({
              where: {
                id: dreamId,
              },

              data,

              include: {
                images: {
                  orderBy: {
                    sortOrder:
                      "asc",
                  },
                },
              },
            });
          },
        );

      // ----------------------------------------------
      // Delete removed images from Cloudinary
      // ----------------------------------------------

      await Promise.all(
        imagesToRemove.map(
          (image) =>
            deleteFromCloudinary(
              image.publicId,
            ),
        ),
      );

      res.json({
        dream,
      });
    } catch (error) {
      // Clean up newly uploaded images
      // if the database operation failed.
      await Promise.all(
        uploadedPublicIds.map(
          (publicId) =>
            deleteFromCloudinary(
              publicId,
            ),
        ),
      );

      next(error);
    }
  },
);

// --------------------------------------------------
// DELETE DREAM
// --------------------------------------------------

router.delete(
  "/:id",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    try {
      if (!req.account) {
        res.status(401).json({
          message:
            "Authentication required.",
        });

        return;
      }

      const accountId =
        req.account.id;

      const dreamId =
        String(req.params.id);

      const dream =
        await prisma.dream.findUnique({
          where: {
            id: dreamId,
          },

          include: {
            images: true,
          },
        });

      if (!dream) {
        res.status(404).json({
          message:
            "Dream not found.",
        });

        return;
      }

      if (
        dream.accountId !==
        accountId
      ) {
        res.status(403).json({
          message:
            "Only the dream owner can delete this dream.",
        });

        return;
      }

      // Delete images from Cloudinary first.
      await Promise.all(
        dream.images.map(
          (image) =>
            deleteFromCloudinary(
              image.publicId,
            ),
        ),
      );

      // Prisma cascade deletes
      // the DreamImage records.
      await prisma.dream.delete({
        where: {
          id: dreamId,
        },
      });

      res.json({
        message:
          "Dream deleted.",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;