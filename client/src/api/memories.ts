const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000"

export type MemoryImage = {
  id: string;
  memoryId: string;
  url: string;
  publicId: string;
  sortOrder: number;
  createdAt: string;
};

export type Memory = {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  images: MemoryImage[];
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
// GET ALL MEMORIES
// --------------------------------------------------

export async function getMemories(): Promise<
  Memory[]
> {
  const data =
    await request<{
      memories: Memory[];
    }>("/api/memories");

  return data.memories;
}

// --------------------------------------------------
// GET ONE MEMORY
// --------------------------------------------------

export async function getMemory(
  id: string,
): Promise<Memory> {
  const data =
    await request<{
      memory: Memory;
    }>(
      `/api/memories/${encodeURIComponent(id)}`,
    );

  return data.memory;
}

// --------------------------------------------------
// CREATE MEMORY
// --------------------------------------------------

export type CreateMemoryInput = {
  title: string;
  description?: string;
  images?: File[];
};

export async function createMemory(
  input: CreateMemoryInput,
): Promise<Memory> {
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
      memory: Memory;
    }>("/api/memories", {
      method: "POST",
      body: formData,
    });

  return data.memory;
}

// --------------------------------------------------
// UPDATE MEMORY
// --------------------------------------------------

export type UpdateMemoryInput = {
  title?: string;
  description?: string;
  images?: File[];
  removeImageIds?: string[];
};

export async function updateMemory(
  id: string,
  input: UpdateMemoryInput,
): Promise<Memory> {
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
      memory: Memory;
    }>(
      `/api/memories/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: formData,
      },
    );

  return data.memory;
}

// --------------------------------------------------
// DELETE MEMORY
// --------------------------------------------------

export async function deleteMemory(
  id: string,
): Promise<void> {
  await request<{
    message: string;
  }>(
    `/api/memories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}