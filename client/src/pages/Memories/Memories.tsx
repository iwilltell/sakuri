import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  createMemory,
  deleteMemory,
  getMemories,
  updateMemory,
  type Memory,
} from "../../api/memories";

import "./Memories.css";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(date));
}

function validateImages(
  files: File[],
): File[] {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  return files.filter((file) => {
    if (!allowedTypes.has(file.type)) {
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return false;
    }

    return true;
  });
}

function Memories() {
  const [memories, setMemories] =
    useState<Memory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [createImages, setCreateImages] =
    useState<File[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editDescription, setEditDescription] =
    useState("");

  const [editImages, setEditImages] =
    useState<File[]>([]);

  const [removedImageIds, setRemovedImageIds] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  // --------------------------------------------------
  // LOAD
  // --------------------------------------------------

  const loadMemories = useCallback(
    async () => {
      try {
        setError("");

        const data =
          await getMemories();

        setMemories(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load memories.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  // --------------------------------------------------
  // CREATE IMAGES
  // --------------------------------------------------

  function handleCreateImages(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = validateImages(
      Array.from(
        event.target.files ?? [],
      ),
    );

    setCreateImages((current) => {
      const combined = [
        ...current,
        ...files,
      ];

      return combined.slice(
        0,
        MAX_IMAGES,
      );
    });

    event.target.value = "";
  }

  function removeCreateImage(
    index: number,
  ) {
    setCreateImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    );
  }

  // --------------------------------------------------
  // EDIT IMAGES
  // --------------------------------------------------

  function handleEditImages(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = validateImages(
      Array.from(
        event.target.files ?? [],
      ),
    );

    setEditImages((current) => {
      const combined = [
        ...current,
        ...files,
      ];

      return combined.slice(
        0,
        MAX_IMAGES,
      );
    });

    event.target.value = "";
  }

  function removeEditImage(
    index: number,
  ) {
    setEditImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    );
  }

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  async function handleCreate() {
    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    if (!cleanTitle) {
      setError(
        "Give your memory a title.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const memory =
        await createMemory({
          title: cleanTitle,
          description:
            cleanDescription,
          images: createImages,
        });

      setMemories((current) => [
        memory,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setCreateImages([]);
      setShowCreate(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create memory.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function handleDelete(
    memoryId: string,
  ) {
    try {
      setActionId(memoryId);
      setError("");

      await deleteMemory(memoryId);

      setMemories((current) =>
        current.filter(
          (memory) =>
            memory.id !== memoryId,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete memory.",
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function startEditing(
    memory: Memory,
  ) {
    setEditingId(memory.id);
    setEditTitle(memory.title);
    setEditDescription(
      memory.description ?? "",
    );
    setEditImages([]);
    setRemovedImageIds([]);
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditImages([]);
    setRemovedImageIds([]);
  }

  function toggleRemoveExistingImage(
    imageId: string,
  ) {
    setRemovedImageIds((current) =>
      current.includes(imageId)
        ? current.filter(
            (id) => id !== imageId,
          )
        : [...current, imageId],
    );
  }

  async function handleUpdate(
    memoryId: string,
  ) {
    const cleanTitle =
      editTitle.trim();

    if (!cleanTitle) {
      setError(
        "Memory title cannot be empty.",
      );

      return;
    }

    try {
      setActionId(memoryId);
      setError("");

      const updated =
        await updateMemory(
          memoryId,
          {
            title: cleanTitle,
            description:
              editDescription.trim(),
            images: editImages,
            removeImageIds:
              removedImageIds,
          },
        );

      setMemories((current) =>
        current.map((memory) =>
          memory.id === memoryId
            ? updated
            : memory,
        ),
      );

      cancelEditing();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update memory.",
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <section className="memories-page">
        <div className="memories-loading">
          <span>✿</span>

          <p>
            Loading your memories...
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <section className="memories-page">
      <header className="memories-header">
        <div>
          <p className="memories-eyebrow">
            Moments worth keeping ✿
          </p>

          <h1>
            Memories
          </h1>

          <p className="memories-description">
            Keep the little moments
            you never want to forget.
          </p>
        </div>

        <button
          type="button"
          className="memory-create-button"
          onClick={() => {
            setShowCreate(
              (current) => !current,
            );

            setError("");
          }}
        >
          {showCreate
            ? "Close"
            : "+ New Memory"}
        </button>
      </header>

      {error && (
        <div className="memories-error">
          {error}
        </div>
      )}

      {/* CREATE */}

      {showCreate && (
        <div className="memory-form">
          <h2>
            Create a memory
          </h2>

          <label>
            Title

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              maxLength={200}
              placeholder="What do you want to remember?"
              autoFocus
            />
          </label>

          <label>
            Description

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={5000}
              placeholder="Tell us about this moment..."
              rows={4}
            />
          </label>

          <label>
            Images

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={
                handleCreateImages
              }
            />
          </label>

          {createImages.length >
            0 && (
            <div className="memory-selected-images">
              {createImages.map(
                (
                  image,
                  index,
                ) => (
                  <div
                    className="memory-selected-image"
                    key={`${image.name}-${index}`}
                  >
                    <img
                      src={URL.createObjectURL(
                        image,
                      )}
                      alt=""
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeCreateImage(
                          index,
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          )}

          <p className="memory-date-hint">
            ✿ The date and time will be
            added automatically.
          </p>

          <button
            type="button"
            className="memory-save-button"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving
              ? "Creating..."
              : "Save Memory ✿"}
          </button>
        </div>
      )}

      {/* EMPTY */}

      {memories.length === 0 ? (
        <div className="memories-empty">
          <div className="memories-empty-icon">
            ✿
          </div>

          <h2>
            No memories yet
          </h2>

          <p>
            Your first memory is
            waiting to be kept.
          </p>

          {!showCreate && (
            <button
              type="button"
              className="memory-save-button"
              onClick={() =>
                setShowCreate(true)
              }
            >
              Create your first memory
            </button>
          )}
        </div>
      ) : (
        <div className="memory-grid">
          {memories.map(
            (memory) => {
              const editing =
                editingId ===
                memory.id;

              const busy =
                actionId ===
                memory.id;

              const visibleImages =
                memory.images.filter(
                  (image) =>
                    !removedImageIds.includes(
                      image.id,
                    ),
                );

              return (
                <article
                  className="memory-card"
                  key={memory.id}
                >
                  {visibleImages.length >
                    0 && (
                    <div className="memory-images">
                      {visibleImages.map(
                        (image) => (
                          <div
                            className="memory-image-wrapper"
                            key={image.id}
                          >
                            <img
                              src={
                                image.url
                              }
                              alt=""
                              className="memory-image"
                            />

                            {editing && (
                              <button
                                type="button"
                                className="memory-image-remove"
                                onClick={() =>
                                  toggleRemoveExistingImage(
                                    image.id,
                                  )
                                }
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="memory-card-content">
                    <span className="memory-date">
                      {formatDate(
                        memory.createdAt,
                      )}
                    </span>

                    {editing ? (
                      <>
                        <input
                          className="memory-edit-input"
                          value={
                            editTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditTitle(
                              event.target
                                .value,
                            )
                          }
                          maxLength={200}
                        />

                        <textarea
                          className="memory-edit-textarea"
                          value={
                            editDescription
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditDescription(
                              event.target
                                .value,
                            )
                          }
                          maxLength={5000}
                          rows={4}
                        />

                        <label className="memory-image-input">
                          Add images

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={
                              handleEditImages
                            }
                          />
                        </label>

                        {editImages.length >
                          0 && (
                          <div className="memory-selected-images">
                            {editImages.map(
                              (
                                image,
                                index,
                              ) => (
                                <div
                                  className="memory-selected-image"
                                  key={`${image.name}-${index}`}
                                >
                                  <img
                                    src={URL.createObjectURL(
                                      image,
                                    )}
                                    alt=""
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeEditImage(
                                        index,
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        <div className="memory-actions">
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdate(
                                memory.id,
                              )
                            }
                            disabled={
                              busy
                            }
                          >
                            {busy
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelEditing
                            }
                            disabled={
                              busy
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2>
                          {memory.title}
                        </h2>

                        {memory.description && (
                          <p className="memory-description">
                            {
                              memory.description
                            }
                          </p>
                        )}

                        <div className="memory-actions">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                memory,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                memory.id,
                              )
                            }
                            disabled={
                              busy
                            }
                          >
                            {busy
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

export default Memories;