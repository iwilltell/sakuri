import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import "./styles/app.css";

import PinReset from "./pages/PinReset/PinReset";
import Dreams from "./pages/Dreams/Dreams";
import Memories from "./pages/Memories/Memories";
import Profile, {
  type ProfileData,
} from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import GuestDemo from "./pages/GuestDemo/GuestDemo";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

type SetupStatus = {
  accountCount: number;
  profileCount: number;
  remainingAccounts: number;
  setupComplete: boolean;
};

type Profile = ProfileData;

type Account = {
  id: string;
  email: string;
  profile: Profile | null;
};

type TimePeriod =
  | "morning"
  | "noon"
  | "evening"
  | "night";

type AppPage =
  | "home"
  | "dreams"
  | "memories"
  | "profile"
  | "settings";

type Screen =
  | "loading"
  | "setup"
  | "profile"
  | "login"
  | "pin-reset"
  | "app"
  | "guest";

// --------------------------------------------------
// TIME
// --------------------------------------------------

function getTimePeriod(): TimePeriod {
  const hour =
    new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "noon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

function getGreeting(
  period: TimePeriod,
) {
  switch (period) {
    case "morning":
      return "Good morning";

    case "noon":
      return "Good afternoon";

    case "evening":
      return "Good evening";

    case "night":
      return "Good night";
  }
}

// --------------------------------------------------
// BACKGROUNDS
// --------------------------------------------------

const backgroundImages = {
  morning: {
    desktop:
      "/images/morning/desktop.jpg",
    mobile:
      "/images/morning/mobile.jpg",
  },

  noon: {
    desktop:
      "/images/noon/desktop.jpg",
    mobile:
      "/images/noon/mobile.jpg",
  },

  evening: {
    desktop:
      "/images/evening/desktop.jpg",
    mobile:
      "/images/evening/mobile.jpg",
  },

  night: {
    desktop:
      "/images/night/desktop.jpg",
    mobile:
      "/images/night/mobile.jpg",
  },
};

// --------------------------------------------------
// APP
// --------------------------------------------------

function App() {
  const [screen, setScreen] =
    useState<Screen>("loading");

  const [page, setPage] =
    useState<AppPage>("home");

  const [period, setPeriod] =
    useState<TimePeriod>(
      getTimePeriod(),
    );

  const [account, setAccount] =
    useState<Account | null>(null);

  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [email, setEmail] =
    useState("");

  const [pin, setPin] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [profileImage, setProfileImage] =
    useState<File | null>(null);

  const [profilePreview, setProfilePreview] =
    useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] =
    useState<Profile | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // --------------------------------------------------
  // TIME UPDATE
  // --------------------------------------------------

  useEffect(() => {
    const updatePeriod = () => {
      setPeriod(getTimePeriod());
    };

    updatePeriod();

    const interval =
      window.setInterval(
        updatePeriod,
        60_000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  // --------------------------------------------------
  // INITIAL STATE
  // --------------------------------------------------

  useEffect(() => {
    void checkApplicationState();
  }, []);

  async function checkApplicationState() {
    try {
      const sessionResponse =
        await fetch(
          `${API_URL}/api/auth/me`,
          {
            credentials: "include",
          },
        );

      if (sessionResponse.ok) {
        const data =
          await sessionResponse.json();

        setAccount(data.account);

        if (!data.account?.profile) {
          setScreen("profile");
        } else {
          setScreen("app");
        }

        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/setup/status`,
        );

      if (!response.ok) {
        throw new Error(
          "Unable to check setup.",
        );
      }

      const status: SetupStatus =
        await response.json();

      if (status.accountCount === 0) {
        setScreen("setup");
      } else {
        await loadProfiles();
      }
    } catch (error) {
      console.error(error);

      setError(
        "Sakuri couldn't connect to the server.",
      );

      setScreen("setup");
    }
  }

  // --------------------------------------------------
  // LOAD PROFILES
  // --------------------------------------------------

  async function loadProfiles() {
    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/profiles`,
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to load profiles.",
        );
      }

      setProfiles(
        data.profiles ?? [],
      );

      setScreen("login");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load profiles.",
      );

      setScreen("login");
    }
  }

  // --------------------------------------------------
  // FIRST ACCOUNT
  // --------------------------------------------------

  async function createAccount() {
    setError("");

    if (!email.trim()) {
      setError(
        "Enter your email.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      setError(
        "Enter a valid email address.",
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError(
        "Your PIN must contain exactly 4 digits.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/first-setup`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              email:
                email.trim(),
              pin,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to create account.",
        );
      }

      setPin("");
      setAccount(data.account);
      setScreen("profile");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // INITIAL PROFILE IMAGE
  // --------------------------------------------------

  function handleProfileImage(
    file: File | null,
  ) {
    setError("");

    if (!file) {
      setProfileImage(null);
      setProfilePreview(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please choose a JPG, PNG or WebP image.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile picture must be smaller than 5 MB.",
      );
      return;
    }

    setProfileImage(file);

    setProfilePreview(
      URL.createObjectURL(file),
    );
  }

  // --------------------------------------------------
  // CREATE PROFILE
  // --------------------------------------------------

  async function createProfile() {
    setError("");

    if (!username.trim()) {
      setError(
        "Choose a username.",
      );
      return;
    }

    if (username.trim().length > 40) {
      setError(
        "Username must be 40 characters or fewer.",
      );
      return;
    }

    setLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "username",
        username.trim(),
      );

      formData.append(
        "description",
        description.trim(),
      );

      if (profileImage) {
        formData.append(
          "profileImage",
          profileImage,
        );
      }

      const response =
        await fetch(
          `${API_URL}/api/profile`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to create profile.",
        );
      }

      setAccount((current) =>
        current
          ? {
              ...current,
              profile:
                data.profile,
            }
          : current,
      );

      setUsername("");
      setDescription("");
      setProfileImage(null);
      setProfilePreview(null);

      setScreen("app");
      setPage("home");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  function selectProfile(
    profile: Profile,
  ) {
    setSelectedProfile(profile);
    setPin("");
    setError("");
  }

  async function login() {
    setError("");

    if (!selectedProfile) {
      setError(
        "Choose a profile first.",
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError(
        "Enter your 4-digit PIN.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              accountId:
                selectedProfile.accountId,
              pin,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Incorrect PIN.",
        );
      }

      setAccount(data.account);
      setPin("");
      setSelectedProfile(null);
      setScreen("app");
      setPage("home");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log in.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  async function logout() {
    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/logout`,
          {
            method: "POST",
            credentials: "include",
          },
        );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data.message ??
            "Unable to log out.",
        );
      }

      setAccount(null);
      setSelectedProfile(null);
      setPin("");

      await loadProfiles();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log out.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // PROFILE UPDATED
  // --------------------------------------------------

  function handleProfileUpdated(
    updatedProfile: ProfileData,
  ) {
    setAccount((current) =>
      current
        ? {
            ...current,
            profile:
              updatedProfile,
          }
        : current,
    );

    setProfiles((current) =>
      current.map((item) =>
        item.id === updatedProfile.id
          ? updatedProfile
          : item,
      ),
    );
  }

  // --------------------------------------------------
  // PIN RESET
  // --------------------------------------------------

  async function handlePinResetComplete() {
    setError("");
    setPin("");
    setSelectedProfile(null);

    await loadProfiles();
  }

  // --------------------------------------------------
  // GUEST MODE
  // --------------------------------------------------

  function enterGuestMode() {
    setError("");
    setPin("");
    setSelectedProfile(null);
    setScreen("guest");
  }

  function exitGuestMode() {
    setError("");
    setScreen("loading");
    void checkApplicationState();
  }

  // --------------------------------------------------
  // BACKGROUND
  // --------------------------------------------------

  const background =
    backgroundImages[period];

  const greeting =
    getGreeting(period);

  const backgroundStyle =
    {
      "--desktop-background": `url("${background.desktop}")`,
      "--mobile-background": `url("${background.mobile}")`,
    } as CSSProperties;

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (screen === "loading") {
    return (
      <main
        className="sakuri-app"
        style={backgroundStyle}
      >
        <div className="background-layer" />
        <div className="background-overlay" />

        <section className="center-screen">
          <div className="glass setup-card">
            <img
              src="/logo.png"
              alt="Sakuri"
              className="setup-logo"
            />

            <p>
              Opening Sakuri...
            </p>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // SETUP
  // --------------------------------------------------

  if (screen === "setup") {
    return (
      <main
        className="sakuri-app"
        style={backgroundStyle}
      >
        <div className="background-layer" />
        <div className="background-overlay" />

        <section className="center-screen">
          <div className="glass setup-card">
            <img
              src="/logo.png"
              alt="Sakuri"
              className="setup-logo"
            />

            <p className="eyebrow">
              A little place for us 🌸
            </p>

            <h1>
              Welcome to Sakuri
            </h1>

            <p className="setup-text">
              {profiles.length > 0
                ? "Let's create another private account."
                : "Let's create your private account first."}
            </p>

            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="Your email"
                autoComplete="email"
              />
            </label>

            <label>
              4-digit PIN

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value.replace(
                      /\D/g,
                      "",
                    ),
                  )
                }
                placeholder="••••"
                autoComplete="new-password"
              />
            </label>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={
                createAccount
              }
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Continue 🌸"}
            </button>

            {profiles.length > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError("");
                  setEmail("");
                  setPin("");
                  setScreen("login");
                }}
                disabled={loading}
              >
                Back to profiles
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // INITIAL PROFILE CREATION
  // --------------------------------------------------

  if (screen === "profile") {
    return (
      <main
        className="sakuri-app"
        style={backgroundStyle}
      >
        <div className="background-layer" />
        <div className="background-overlay" />

        <section className="center-screen">
          <div className="glass setup-card">
            <img
              src="/logo.png"
              alt="Sakuri"
              className="setup-logo"
            />

            <p className="eyebrow">
              One last little thing 🌸
            </p>

            <h1>
              Create your profile
            </h1>

            <p className="setup-text">
              This is how you'll appear
              inside Sakuri.
            </p>

            <div className="profile-preview">
              <label
                className="profile-upload"
                htmlFor="profile-image"
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="profile-preview-image"
                  />
                ) : (
                  <div className="profile-upload-empty">
                    <span>♡</span>

                    <small>
                      Add picture
                    </small>
                  </div>
                )}

                <input
                  id="profile-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    handleProfileImage(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                />
              </label>
            </div>

            <label>
              Username

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                maxLength={40}
                placeholder="Your username"
                autoComplete="nickname"
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
                maxLength={300}
                placeholder="A little about you..."
                rows={4}
              />
            </label>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={
                createProfile
              }
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Create Profile 🌸"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // PIN RESET
  // --------------------------------------------------

  if (screen === "pin-reset") {
    return (
      <main
        className="sakuri-app"
        style={backgroundStyle}
      >
        <div className="background-layer" />
        <div className="background-overlay" />

        <PinReset
          onComplete={() =>
            void handlePinResetComplete()
          }
          onBackToLogin={() => {
            setError("");
            setPin("");
            setSelectedProfile(null);
            setScreen("login");
          }}
        />
      </main>
    );
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  if (screen === "login") {
    return (
      <main
        className="sakuri-app"
        style={backgroundStyle}
      >
        <div className="background-layer" />
        <div className="background-overlay" />

        <section className="login-screen">
          <div className="login-header">
            <img
              src="/logo.png"
              alt="Sakuri"
              className="login-logo"
            />

            <p className="eyebrow">
              Welcome back 🌸
            </p>

            <h1>
              Who's here?
            </h1>

            <p>
              Choose your profile
              to continue.
            </p>
          </div>

          <div className="profile-grid">
            {profiles.map(
              (profile) => {
                const selected =
                  selectedProfile?.id ===
                  profile.id;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`glass login-profile ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectProfile(
                        profile,
                      )
                    }
                  >
                    <div className="login-avatar">
                      {profile.profileImage ? (
                        <img
                          src={
                            profile.profileImage
                          }
                          alt={
                            profile.username
                          }
                        />
                      ) : (
                        <span>
                          ♡
                        </span>
                      )}
                    </div>

                    <strong>
                      {profile.username}
                    </strong>

                    {selected && (
                      <span className="selected-mark">
                        ✓
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={enterGuestMode}
            disabled={loading}
          >
            ✿ Continue as Guest
          </button>

          {profiles.length < 2 && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setError("");
                setEmail("");
                setPin("");
                setScreen("setup");
              }}
              disabled={loading}
            >
              + Create another account
            </button>
          )}

          {profiles.length === 0 && (
            <div className="glass empty-state">
              <span>♡</span>

              <h2>
                No profiles yet
              </h2>

              <p>
                Create an account to
                get started.
              </p>
            </div>
          )}

          {selectedProfile && (
            <div className="glass pin-card">
              <div className="selected-profile-small">
                {selectedProfile.profileImage ? (
                  <img
                    src={
                      selectedProfile.profileImage
                    }
                    alt={
                      selectedProfile.username
                    }
                  />
                ) : (
                  <span>
                    ♡
                  </span>
                )}
              </div>

              <h2>
                {selectedProfile.username}
              </h2>

              <p>
                Enter your 4-digit PIN
              </p>

              <input
                className="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={(event) =>
                  setPin(
                    event.target.value.replace(
                      /\D/g,
                      "",
                    ),
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void login();
                  }
                }}
                placeholder="••••"
                autoComplete="current-password"
              />

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                type="button"
                onClick={login}
                disabled={
                  loading ||
                  pin.length !== 4
                }
              >
                {loading
                  ? "Unlocking..."
                  : "Unlock 🌸"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError("");
                  setPin("");
                  setScreen(
                    "pin-reset",
                  );
                }}
                disabled={loading}
              >
                Forgot PIN?
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // GUEST / DEMO MODE
  // --------------------------------------------------

  if (screen === "guest") {
    return <GuestDemo onExit={exitGuestMode} />;
  }

  // --------------------------------------------------
  // AUTHENTICATED APP
  // --------------------------------------------------

  const profile =
    account?.profile;

  return (
    <main
      className="sakuri-app"
      style={backgroundStyle}
    >
      <div className="background-layer" />
      <div className="background-overlay" />

      <div className="app-shell">

        {/* TOP BAR */}

        <header className="app-topbar glass">
          <div className="brand">
            <img
              src="/logo.png"
              alt="Sakuri"
              className="brand-logo"
            />

            <span>
              Sakuri
            </span>
          </div>

          <button
            type="button"
            className="top-profile-button"
            onClick={() =>
              setPage("profile")
            }
          >
            {profile?.profileImage ? (
              <img
                src={
                  profile.profileImage
                }
                alt={
                  profile.username
                }
              />
            ) : (
              <span>
                ♡
              </span>
            )}
          </button>
        </header>

        {/* MAIN CONTENT */}

        <section className="app-content">

          {/* HOME */}

          {page === "home" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">
                  A little place for us 🌸
                </p>

                <h1>
                  {greeting},{" "}
                  {profile?.username}
                </h1>

                <p>
                  Dreams, memories and
                  little moments worth
                  keeping.
                </p>
              </div>

              <div className="home-cards">

                <button
                  type="button"
                  className="glass feature-card"
                  onClick={() =>
                    setPage("dreams")
                  }
                >
                  <span className="feature-icon">
                    ♡
                  </span>

                  <strong>
                    Dreams
                  </strong>

                  <span>
                    Things we want to
                    experience together.
                  </span>
                </button>

                <button
                  type="button"
                  className="glass feature-card"
                  onClick={() =>
                    setPage("memories")
                  }
                >
                  <span className="feature-icon">
                    ✿
                  </span>

                  <strong>
                    Memories
                  </strong>

                  <span>
                    Little moments we
                    want to remember.
                  </span>
                </button>

              </div>
            </div>
          )}

          {/* DREAMS */}

          {page === "dreams" && (
            <Dreams />
          )}

          {/* MEMORIES */}

          {page === "memories" && (
            <Memories />
          )}

          {/* PROFILE */}

          {page === "profile" && (
            <Profile
              onProfileUpdated={
                handleProfileUpdated
              }
            />
          )}

          {/* SETTINGS */}

          {page === "settings" && account && (
            <Settings
              email={account.email}
              onLogout={logout}
            />
          )}

        </section>

        {/* DESKTOP NAVIGATION */}

        <nav className="desktop-navigation glass">
          <button
            type="button"
            className={
              page === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("home")
            }
          >
            <span>⌂</span>
            Home
          </button>

          <button
            type="button"
            className={
              page === "dreams"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("dreams")
            }
          >
            <span>♡</span>
            Dreams
          </button>

          <button
            type="button"
            className={
              page === "memories"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("memories")
            }
          >
            <span>✿</span>
            Memories
          </button>

          <button
            type="button"
            className={
              page === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("profile")
            }
          >
            <span>○</span>
            Profile
          </button>

          <button
            type="button"
            className={
              page === "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>
        </nav>

        {/* MOBILE NAVIGATION */}

        <nav className="mobile-navigation glass">
          <button
            type="button"
            className={
              page === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("home")
            }
          >
            <span>⌂</span>
            Home
          </button>

          <button
            type="button"
            className={
              page === "dreams"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("dreams")
            }
          >
            <span>♡</span>
            Dreams
          </button>

          <button
            type="button"
            className={
              page === "memories"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("memories")
            }
          >
            <span>✿</span>
            Memories
          </button>

          <button
            type="button"
            className={
              page === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("profile")
            }
          >
            <span>○</span>
            Profile
          </button>

          <button
            type="button"
            className={
              page === "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>
        </nav>

      </div>
    </main>
  );
}

export default App;