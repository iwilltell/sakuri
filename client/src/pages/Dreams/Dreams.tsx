import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createDream,
  deleteDream,
  getDreams,
  setDreamPrivacy,
  updateDream,
  type Dream,
} from "../../api/dreams";

import "./Dreams.css";

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(date));
}

const MAX_IMAGES = 10;

function Dreams() {
  const [dreams, setDreams] =
    useState<Dream[]>([]);

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

  const [saving, setSaving] =
    useState(false);

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

  const [actionId, setActionId] =
    useState<string | null>(null);

  // --------------------------------------------------
  // LOAD DREAMS
  // --------------------------------------------------

  const loadDreams = useCallback(
    async () => {
      try {
        setError("");

        const data =
          await getDreams();

        setDreams(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dreams.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDreams();
  }, [loadDreams]);

  // --------------------------------------------------
  // IMAGE VALIDATION
  // --------------------------------------------------

  function validateImages(
    files: File[],
  ): File[] {
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    const validFiles: File[] = [];

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        setError(
          "Only JPG, PNG and WebP images are allowed.",
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(
          `"${file.name}" is larger than 5 MB.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  // --------------------------------------------------
  // CREATE IMAGE SELECT
  // --------------------------------------------------

  function handleCreateImages(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = Array.from(
      event.target.files ?? [],
    );

    const validFiles =
      validateImages(files);

    setCreateImages((current) => {
      const combined = [
        ...current,
        ...validFiles,
      ];

      if (combined.length > MAX_IMAGES) {
        setError(
          `You can add up to ${MAX_IMAGES} images.`,
        );

        return combined.slice(
          0,
          MAX_IMAGES,
        );
      }

      return combined;
    });

    event.target.value = "";
  }

  // --------------------------------------------------
  // EDIT IMAGE SELECT
  // --------------------------------------------------

  function handleEditImages(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = Array.from(
      event.target.files ?? [],
    );

    const validFiles =
      validateImages(files);

    setEditImages((current) => {
      const combined = [
        ...current,
        ...validFiles,
      ];

      if (combined.length > MAX_IMAGES) {
        setError(
          `You can add up to ${MAX_IMAGES} new images.`,
        );

        return combined.slice(
          0,
          MAX_IMAGES,
        );
      }

      return combined;
    });

    event.target.value = "";
  }

  // --------------------------------------------------
  // REMOVE NEW IMAGE
  // --------------------------------------------------

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
  // REMOVE EXISTING IMAGE
  // --------------------------------------------------

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
        "Give your dream a title.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const dream =
        await createDream({
          title: cleanTitle,
          description:
            cleanDescription,
          isPrivate: false,
          images: createImages,
        });

      setDreams((current) => [
        dream,
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
          : "Unable to create dream.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function handleDelete(
    dreamId: string,
  ) {
    try {
      setActionId(dreamId);
      setError("");

      await deleteDream(dreamId);

      setDreams((current) =>
        current.filter(
          (dream) =>
            dream.id !== dreamId,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete dream.",
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // PRIVATE / SHARED
  // --------------------------------------------------

  async function handlePrivacy(
    dream: Dream,
  ) {
    try {
      setActionId(dream.id);
      setError("");

      const updated =
        await setDreamPrivacy(
          dream.id,
          dream.visibility !==
            "PRIVATE",
        );

      setDreams((current) =>
        current.map((item) =>
          item.id === dream.id
            ? updated
            : item,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to change privacy.",
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function startEditing(
    dream: Dream,
  ) {
    setEditingId(dream.id);
    setEditTitle(dream.title);
    setEditDescription(
      dream.description ?? "",
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

  async function handleUpdate(
    dreamId: string,
  ) {
    const cleanTitle =
      editTitle.trim();

    if (!cleanTitle) {
      setError(
        "Dream title cannot be empty.",
      );
      return;
    }

    try {
      setActionId(dreamId);
      setError("");

      const updated =
        await updateDream(
          dreamId,
          {
            title: cleanTitle,
            description:
              editDescription.trim(),
            images: editImages,
            removeImageIds:
              removedImageIds,
          },
        );

      setDreams((current) =>
        current.map((dream) =>
          dream.id === dreamId
            ? updated
            : dream,
        ),
      );

      cancelEditing();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update dream.",
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
      <section className="dreams-page">
        <div className="dreams-loading">
          <span>🌸</span>

          <p>
            Loading your dreams...
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <section className="dreams-page">
      <header className="dreams-header">
        <div>
          <p className="dreams-eyebrow">
            Your little wishes 🌸
          </p>

          <h1>Dreams</h1>

          <p className="dreams-description">
            Keep the things you want
            to make real.
          </p>
        </div>

        <button
          type="button"
          className="dream-create-button"
          onClick={() => {
            setShowCreate(
              (current) => !current,
            );
            setError("");
          }}
        >
          {showCreate
            ? "Close"
            : "+ New Dream"}
        </button>
      </header>

      {error && (
        <div className="dreams-error">
          {error}
        </div>
      )}

      {/* --------------------------------------------------
          CREATE FORM
          -------------------------------------------------- */}

      {showCreate && (
        <div className="dream-form">
          <h2>
            Create a dream
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
              placeholder="What do you dream of?"
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
              placeholder="Tell us a little more..."
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
            <div className="dream-selected-images">
              {createImages.map(
                (
                  image,
                  index,
                ) => (
                  <div
                    className="dream-selected-image"
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

          <p className="privacy-hint">
            ✨ Dreams are shared by
            default. Use ⭐ after
            creating one to make it
            private.
          </p>

          <button
            type="button"
            className="dream-save-button"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving
              ? "Creating..."
              : "Create Dream 🌸"}
          </button>
        </div>
      )}

      {/* --------------------------------------------------
          EMPTY STATE
          -------------------------------------------------- */}

      {dreams.length === 0 ? (
        <div className="dreams-empty">
          <div className="dreams-empty-icon">
            ♡
          </div>

          <h2>
            No dreams yet
          </h2>

          <p>
            Your first dream is
            waiting to be written.
          </p>

          {!showCreate && (
            <button
              type="button"
              className="dream-save-button"
              onClick={() =>
                setShowCreate(true)
              }
            >
              Create your first dream
            </button>
          )}
        </div>
      ) : (
        <div className="dream-grid">
          {dreams.map((dream) => {
            const editing =
              editingId === dream.id;

            const busy =
              actionId === dream.id;

            const visibleImages =
              dream.images.filter(
                (image) =>
                  !removedImageIds.includes(
                    image.id,
                  ),
              );

            return (
              <article
                className="dream-card"
                key={dream.id}
              >
                {/* Existing images */}

                {visibleImages.length >
                  0 && (
                  <div className="dream-images">
                    {visibleImages.map(
                      (image) => (
                        <div
                          className="dream-image-wrapper"
                          key={image.id}
                        >
                          <img
                            src={image.url}
                            alt=""
                            className="dream-image"
                          />

                          {editing && (
                            <button
                              type="button"
                              className="dream-image-remove"
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

                <div className="dream-card-content">
                  <div className="dream-card-top">
                    <span className="dream-date">
                      {formatDate(
                        dream.createdAt,
                      )}
                    </span>

                    <button
                      type="button"
                      className={`dream-privacy ${
                        dream.visibility ===
                        "PRIVATE"
                          ? "private"
                          : ""
                      }`}
                      onClick={() =>
                        void handlePrivacy(
                          dream,
                        )
                      }
                      disabled={busy}
                      title={
                        dream.visibility ===
                        "PRIVATE"
                          ? "Make shared"
                          : "Make private"
                      }
                    >
                      {dream.visibility ===
                      "PRIVATE"
                        ? "⭐"
                        : "☆"}
                    </button>
                  </div>

                  {editing ? (
                    <>
                      <input
                        className="dream-edit-input"
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
                        className="dream-edit-textarea"
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

                      <label className="dream-image-input">
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
                        <div className="dream-selected-images">
                          {editImages.map(
                            (
                              image,
                              index,
                            ) => (
                              <div
                                className="dream-selected-image"
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

                      <div className="dream-actions">
                        <button
                          type="button"
                          onClick={() =>
                            void handleUpdate(
                              dream.id,
                            )
                          }
                          disabled={busy}
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
                          disabled={busy}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2>
                        {dream.title}
                      </h2>

                      {dream.description && (
                        <p className="dream-description">
                          {
                            dream.description
                          }
                        </p>
                      )}

                      <div className="dream-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              dream,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              dream.id,
                            )
                          }
                          disabled={busy}
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
          })}
        </div>
      )}
    </section>
  );
}

export default Dreams;