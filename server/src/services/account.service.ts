import { cloudinary } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

function extractCloudinaryPublicId(
  imageUrl: string | null,
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    const uploadMarker = "/upload/";
    const uploadIndex = url.pathname.indexOf(
      uploadMarker,
    );

    if (uploadIndex === -1) {
      return null;
    }

    let remainder = url.pathname.slice(
      uploadIndex + uploadMarker.length,
    );

    const segments = remainder
      .split("/")
      .filter(Boolean);

    // Cloudinary URLs can contain transformation segments
    // between /upload/ and the version/public ID.
    const versionIndex = segments.findIndex(
      (segment) => /^v\d+$/.test(segment),
    );

    if (versionIndex >= 0) {
      segments.splice(0, versionIndex + 1);
    }

    if (segments.length === 0) {
      return null;
    }

    const lastIndex =
      segments.length - 1;

    segments[lastIndex] = segments[lastIndex].replace(
      /\.[^./]+$/,
      "",
    );

    return decodeURIComponent(
      segments.join("/"),
    );
  } catch {
    return null;
  }
}

async function deleteCloudinaryImage(
  publicId: string,
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      },
    );
  } catch (error) {
    console.error(
      `Failed to delete Cloudinary image ${publicId}:`,
      error,
    );
  }
}

export async function deleteAccount(
  accountId: string,
): Promise<void> {
  const account =
    await prisma.account.findUnique({
      where: {
        id: accountId,
      },
      select: {
        id: true,
        profile: {
          select: {
            profileImage: true,
          },
        },
        dreams: {
          select: {
            images: {
              select: {
                publicId: true,
              },
            },
          },
        },
        memories: {
          select: {
            images: {
              select: {
                publicId: true,
              },
            },
          },
        },
      },
    });

  if (!account) {
    throw new Error(
      "Account could not be found.",
    );
  }

  const publicIds = new Set<string>();

  const profilePublicId =
    extractCloudinaryPublicId(
      account.profile?.profileImage ?? null,
    );

  if (profilePublicId) {
    publicIds.add(profilePublicId);
  }

  for (const dream of account.dreams) {
    for (const image of dream.images) {
      if (image.publicId) {
        publicIds.add(image.publicId);
      }
    }
  }

  for (const memory of account.memories) {
    for (const image of memory.images) {
      if (image.publicId) {
        publicIds.add(image.publicId);
      }
    }
  }

  /*
   * The database relations are configured with onDelete: Cascade.
   * Deleting the Account therefore removes the profile, sessions,
   * OTP records, dreams, dream images, memories and memory images.
   */
  await prisma.account.delete({
    where: {
      id: account.id,
    },
  });

  // Cloudinary is external to PostgreSQL, so remove its assets
  // separately. These are best-effort cleanup operations and must
  // never prevent the account itself from being permanently deleted.
  await Promise.all(
    [...publicIds].map(
      (publicId) =>
        deleteCloudinaryImage(publicId),
    ),
  );
}
