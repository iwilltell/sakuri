const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

export type DreamImage = {
  id: string;
  dreamId: string;
  url: string;
  publicId: string;
  sortOrder: number;
  createdAt: string;
};

export type Dream = {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  visibility: "SHARED" | "PRIVATE";
  createdAt: string;
  updatedAt: string;
  images: DreamImage[];
};

type ApiError = {
  message?: string;
};

async function request<T extends object>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${url}`,
    {
      ...options,
      credentials: "include",
    },
  );

  let data: T | ApiError;

  try {
    data = (await response.json()) as
      | T
      | ApiError;
  } catch {
    throw new Error(
      "The server returned an invalid response.",
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong.";

    throw new Error(message);
  }

  return data as T;
}

// --------------------------------------------------
// GET ALL DREAMS
// --------------------------------------------------

export async function getDreams(): Promise<
  Dream[]
> {
  const data =
    await request<{
      dreams: Dream[];
    }>("/api/dreams");

  return data.dreams;
}

// --------------------------------------------------
// GET ONE DREAM
// --------------------------------------------------

export async function getDream(
  id: string,
): Promise<Dream> {
  const data =
    await request<{
      dream: Dream;
    }>(
      `/api/dreams/${encodeURIComponent(id)}`,
    );

  return data.dream;
}

// --------------------------------------------------
// CREATE DREAM
// --------------------------------------------------

export type CreateDreamInput = {
  title: string;
  description?: string;
  isPrivate?: boolean;
  images?: File[];
};

export async function createDream(
  input: CreateDreamInput,
): Promise<Dream> {
  const formData =
    new FormData();

  formData.append(
    "title",
    input.title,
  );

  formData.append(
    "description",
    input.description ?? "",
  );

  formData.append(
    "isPrivate",
    String(
      input.isPrivate ?? false,
    ),
  );

  for (
    const image of
      input.images ?? []
  ) {
    formData.append(
      "images",
      image,
    );
  }

  const data =
    await request<{
      dream: Dream;
    }>("/api/dreams", {
      method: "POST",
      body: formData,
    });

  return data.dream;
}

// --------------------------------------------------
// UPDATE DREAM
// --------------------------------------------------

export type UpdateDreamInput = {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  images?: File[];
  removeImageIds?: string[];
};

export async function updateDream(
  id: string,
  input: UpdateDreamInput,
): Promise<Dream> {
  const formData =
    new FormData();

  if (
    input.title !== undefined
  ) {
    formData.append(
      "title",
      input.title,
    );
  }

  if (
    input.description !==
    undefined
  ) {
    formData.append(
      "description",
      input.description,
    );
  }

  if (
    input.isPrivate !== undefined
  ) {
    formData.append(
      "isPrivate",
      String(input.isPrivate),
    );
  }

  if (
    input.removeImageIds &&
    input.removeImageIds.length > 0
  ) {
    formData.append(
      "removeImageIds",
      JSON.stringify(
        input.removeImageIds,
      ),
    );
  }

  for (
    const image of
      input.images ?? []
  ) {
    formData.append(
      "images",
      image,
    );
  }

  const data =
    await request<{
      dream: Dream;
    }>(
      `/api/dreams/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: formData,
      },
    );

  return data.dream;
}

// --------------------------------------------------
// SET DREAM PRIVACY
// --------------------------------------------------

export async function setDreamPrivacy(
  id: string,
  isPrivate: boolean,
): Promise<Dream> {
  return updateDream(id, {
    isPrivate,
  });
}

// --------------------------------------------------
// DELETE DREAM
// --------------------------------------------------

export async function deleteDream(
  id: string,
): Promise<void> {
  await request<{
    message: string;
  }>(
    `/api/dreams/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}