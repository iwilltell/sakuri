import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import "./Profile.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000"

export type ProfileData = {
  id: string;
  accountId: string;
  username: string;
  profileImage: string | null;
  description: string | null;
};

type ProfileResponse = {
  profile: ProfileData;
};

type ProfileProps = {
  onProfileUpdated?: (
    profile: ProfileData,
  ) => void;
};

type MeResponse = {
  account?: {
    profile?: ProfileData | null;
  };
  message?: string;
};

function Profile({
  onProfileUpdated,
}: ProfileProps) {
  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [username, setUsername] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [image, setImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [editing, setEditing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/api/auth/me`,
          {
            credentials: "include",
          },
        );

      const data =
        (await response.json()) as MeResponse;

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to load profile.",
        );
      }

      const accountProfile =
        data.account?.profile;

      if (!accountProfile) {
        throw new Error(
          "Profile data was not returned.",
        );
      }

      setProfile(accountProfile);

      setUsername(
        accountProfile.username,
      );

      setDescription(
        accountProfile.description ??
          "",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // IMAGE
  // --------------------------------------------------

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const file =
      event.target.files?.[0] ??
      null;

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WebP images are allowed.",
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Profile image must be smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file),
    );
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function startEditing() {
    if (!profile) {
      return;
    }

    setUsername(
      profile.username,
    );

    setDescription(
      profile.description ?? "",
    );

    setImage(null);
    setPreview(null);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!profile) {
      return;
    }

    setUsername(
      profile.username,
    );

    setDescription(
      profile.description ?? "",
    );

    setImage(null);
    setPreview(null);
    setError("");
    setEditing(false);
  }

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  async function saveProfile() {
    const cleanUsername =
      username.trim();

    const cleanDescription =
      description.trim();

    if (!cleanUsername) {
      setError(
        "Username cannot be empty.",
      );

      return;
    }

    if (cleanUsername.length > 40) {
      setError(
        "Username must be 40 characters or fewer.",
      );

      return;
    }

    if (cleanDescription.length > 300) {
      setError(
        "Description must be 300 characters or fewer.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "username",
        cleanUsername,
      );

      formData.append(
        "description",
        cleanDescription,
      );

      if (image) {
        formData.append(
          "profileImage",
          image,
        );
      }

      const response =
        await fetch(
          `${API_URL}/api/profile`,
          {
            method: "PATCH",
            credentials: "include",
            body: formData,
          },
        );

      const data =
        (await response.json()) as
          | ProfileResponse
          | {
              message?: string;
            };

      if (!response.ok) {
        throw new Error(
          "message" in data &&
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to update profile.",
        );
      }

      if (!("profile" in data)) {
        throw new Error(
          "Updated profile was not returned.",
        );
      }

      setProfile(data.profile);

      setUsername(
        data.profile.username,
      );

      setDescription(
        data.profile.description ??
          "",
      );

      setImage(null);
      setPreview(null);
      setEditing(false);

      onProfileUpdated?.(
        data.profile,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-loading">
          <span>🌸</span>

          <p>
            Loading your profile...
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // NO PROFILE
  // --------------------------------------------------

  if (!profile) {
    return (
      <section className="profile-page">
        <div className="profile-empty">
          <span>♡</span>

          <h1>
            Profile unavailable
          </h1>

          <p>
            {error ||
              "Your profile could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadProfile()
            }
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const displayedImage =
    preview ??
    profile.profileImage;

  // --------------------------------------------------
  // PROFILE PAGE
  // --------------------------------------------------

  return (
    <section className="profile-page">
      <div className="profile-card glass">

        {/* HEADER */}

        <div className="profile-header">
          <div className="profile-avatar">

            {displayedImage ? (
              <img
                src={displayedImage}
                alt={profile.username}
              />
            ) : (
              <span>♡</span>
            )}

          </div>

          <div className="profile-heading">
            <p className="eyebrow">
              Your little space 🌸
            </p>

            <h1>
              {profile.username}
            </h1>

            <p>
              {profile.description ||
                "A quiet place to keep a little piece of yourself."}
            </p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {/* VIEW MODE */}

        {!editing && (
          <div className="profile-actions">
            <button
              type="button"
              className="primary-button"
              onClick={startEditing}
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* EDIT MODE */}

        {editing && (
          <div className="profile-edit">

            <div className="profile-field">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                maxLength={40}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                disabled={saving}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                value={description}
                maxLength={300}
                rows={5}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                disabled={saving}
              />

              <small>
                {description.length}/300
              </small>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-image">
                Profile picture
              </label>

              <input
                id="profile-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleImageChange
                }
                disabled={saving}
              />
            </div>

            {/* IMAGE PREVIEW */}

            {(preview ||
              profile.profileImage) && (
              <div className="profile-preview">
                <img
                  src={
                    preview ??
                    profile.profileImage ??
                    ""
                  }
                  alt="Profile preview"
                />
              </div>
            )}

            {/* EDIT ACTIONS */}

            <div className="profile-actions">

              <button
                type="button"
                className="primary-button"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}

export default Profile;