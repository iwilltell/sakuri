import { Router } from "express";
import multer from "multer";

import { cloudinary } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
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

// --------------------------------------------------
// CLOUDINARY UPLOAD HELPER
// --------------------------------------------------

function uploadProfileImage(
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
            folder:
              "sakuri/profiles",

            resource_type: "image",

            transformation: [
              {
                width: 600,
                height: 600,
                crop: "fill",
                gravity: "face",
              },
            ],
          },

          (
            error,
            result,
          ) => {
            if (
              error ||
              !result
            ) {
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
// CREATE PROFILE
// --------------------------------------------------

router.post(
  "/",
  requireAuth,
  upload.single("profileImage"),

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

      if (req.account.profile) {
        res.status(409).json({
          message:
            "Profile already exists.",
        });

        return;
      }

      const username =
        typeof req.body.username ===
        "string"
          ? req.body.username.trim()
          : "";

      const description =
        typeof req.body.description ===
        "string"
          ? req.body.description.trim()
          : null;

      if (!username) {
        res.status(400).json({
          message:
            "Username is required.",
        });

        return;
      }

      if (
        username.length >
        40
      ) {
        res.status(400).json({
          message:
            "Username must be 40 characters or fewer.",
        });

        return;
      }

      if (
        description &&
        description.length >
          300
      ) {
        res.status(400).json({
          message:
            "Description must be 300 characters or fewer.",
        });

        return;
      }

      const usernameExists =
        await prisma.profile.findFirst(
          {
            where: {
              username,
            },
          },
        );

      if (usernameExists) {
        res.status(409).json({
          message:
            "That username is already being used.",
        });

        return;
      }

      let profileImage:
        | string
        | null = null;

      if (req.file) {
        const uploaded =
          await uploadProfileImage(
            req.file.buffer,
          );

        profileImage =
          uploaded.secure_url;
      }

      const profile =
        await prisma.profile.create({
          data: {
            accountId:
              req.account.id,

            username,

            description,

            profileImage,
          },
        });

      res.status(201).json({
        profile,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// GET MY PROFILE
// --------------------------------------------------

router.get(
  "/me",
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

      const profile =
        await prisma.profile.findUnique({
          where: {
            accountId:
              req.account.id,
          },
        });

      res.json({
        profile,
      });
    } catch (error) {
      next(error);
    }
  },
);

// --------------------------------------------------
// UPDATE PROFILE
// --------------------------------------------------

router.patch(
  "/",
  requireAuth,
  upload.single("profileImage"),

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

      const profile =
        await prisma.profile.findUnique({
          where: {
            accountId:
              req.account.id,
          },
        });

      if (!profile) {
        res.status(404).json({
          message:
            "Profile not found.",
        });

        return;
      }

      const username =
        typeof req.body.username ===
        "string"
          ? req.body.username.trim()
          : profile.username;

      const description =
        typeof req.body.description ===
        "string"
          ? req.body.description.trim()
          : profile.description;

      if (!username) {
        res.status(400).json({
          message:
            "Username is required.",
        });

        return;
      }

      if (
        username.length >
        40
      ) {
        res.status(400).json({
          message:
            "Username must be 40 characters or fewer.",
        });

        return;
      }

      if (
        description &&
        description.length >
          300
      ) {
        res.status(400).json({
          message:
            "Description must be 300 characters or fewer.",
        });

        return;
      }

      const usernameExists =
        await prisma.profile.findFirst(
          {
            where: {
              username,

              NOT: {
                id: profile.id,
              },
            },
          },
        );

      if (usernameExists) {
        res.status(409).json({
          message:
            "That username is already being used.",
        });

        return;
      }

      let profileImage =
        profile.profileImage;

      if (req.file) {
        const uploaded =
          await uploadProfileImage(
            req.file.buffer,
          );

        profileImage =
          uploaded.secure_url;
      }

      const updatedProfile =
        await prisma.profile.update({
          where: {
            id: profile.id,
          },

          data: {
            username,
            description,
            profileImage,
          },
        });

      res.json({
        profile:
          updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;