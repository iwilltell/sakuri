import { useEffect, useMemo, useState } from "react";
import "./GuestDemo.css";

type GuestPage = "home" | "dreams" | "memories" | "profile" | "settings";

type GuestDream = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  location: string;
  status: "dreaming" | "planning" | "completed";
  isPrivate: boolean;
  image: string;
  createdAt: string;
};

type GuestMemory = {
  id: string;
  title: string;
  description: string;
  memoryDate: string;
  location: string;
  image: string;
  createdAt: string;
};

type GuestProfile = {
  username: string;
  description: string;
  image: string;
};

type GuestStore = {
  profile: GuestProfile;
  dreams: GuestDream[];
  memories: GuestMemory[];
};

const STORAGE_KEY = "sakuri_guest_demo_v1";

const defaultStore: GuestStore = {
  profile: {
    username: "Guest",
    description: "Just exploring Sakuri 🌸",
    image: "",
  },
  dreams: [],
  memories: [],
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadStore(): GuestStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore;

    const parsed = JSON.parse(raw) as Partial<GuestStore>;

    return {
      profile: {
        ...defaultStore.profile,
        ...(parsed.profile ?? {}),
      },
      dreams: Array.isArray(parsed.dreams) ? parsed.dreams : [],
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
    };
  } catch {
    return defaultStore;
  }
}

function saveStore(store: GuestStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function GuestDemo({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<GuestPage>("home");
  const [store, setStore] = useState<GuestStore>(() => loadStore());
  const [dreamEditing, setDreamEditing] = useState<GuestDream | null>(null);
  const [memoryEditing, setMemoryEditing] = useState<GuestMemory | null>(null);
  const [dreamForm, setDreamForm] = useState({
    title: "",
    description: "",
    targetDate: "",
    location: "",
    status: "dreaming" as GuestDream["status"],
    isPrivate: false,
    image: "",
  });
  const [memoryForm, setMemoryForm] = useState({
    title: "",
    description: "",
    memoryDate: "",
    location: "",
    image: "",
  });
  const [profileForm, setProfileForm] = useState(store.profile);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    setProfileForm(store.profile);
  }, [store.profile]);

  const greeting = useMemo(() => getGreeting(), []);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function resetDreamForm() {
    setDreamEditing(null);
    setDreamForm({
      title: "",
      description: "",
      targetDate: "",
      location: "",
      status: "dreaming",
      isPrivate: false,
      image: "",
    });
  }

  function resetMemoryForm() {
    setMemoryEditing(null);
    setMemoryForm({
      title: "",
      description: "",
      memoryDate: "",
      location: "",
      image: "",
    });
  }

  function startDreamEdit(dream: GuestDream) {
    setDreamEditing(dream);
    setDreamForm({
      title: dream.title,
      description: dream.description,
      targetDate: dream.targetDate,
      location: dream.location,
      status: dream.status,
      isPrivate: dream.isPrivate,
      image: dream.image,
    });
    setPage("dreams");
  }

  function startMemoryEdit(memory: GuestMemory) {
    setMemoryEditing(memory);
    setMemoryForm({
      title: memory.title,
      description: memory.description,
      memoryDate: memory.memoryDate,
      location: memory.location,
      image: memory.image,
    });
    setPage("memories");
  }

  function saveDream() {
    if (!dreamForm.title.trim()) {
      showNotice("Give your dream a title first 🌸");
      return;
    }

    if (dreamEditing) {
      setStore((current) => ({
        ...current,
        dreams: current.dreams.map((dream) =>
          dream.id === dreamEditing.id
            ? { ...dream, ...dreamForm, title: dreamForm.title.trim() }
            : dream,
        ),
      }));
      showNotice("Dream updated 🌸");
    } else {
      const dream: GuestDream = {
        id: createId(),
        ...dreamForm,
        title: dreamForm.title.trim(),
        createdAt: new Date().toISOString(),
      };
      setStore((current) => ({ ...current, dreams: [dream, ...current.dreams] }));
      showNotice("Dream saved 🌸");
    }

    resetDreamForm();
  }

  function deleteDream(id: string) {
    if (!window.confirm("Delete this demo dream?")) return;
    setStore((current) => ({
      ...current,
      dreams: current.dreams.filter((dream) => dream.id !== id),
    }));
    if (dreamEditing?.id === id) resetDreamForm();
    showNotice("Dream removed.");
  }

  function saveMemory() {
    if (!memoryForm.title.trim()) {
      showNotice("Give your memory a title first 🌸");
      return;
    }

    if (memoryEditing) {
      setStore((current) => ({
        ...current,
        memories: current.memories.map((memory) =>
          memory.id === memoryEditing.id
            ? { ...memory, ...memoryForm, title: memoryForm.title.trim() }
            : memory,
        ),
      }));
      showNotice("Memory updated 🌸");
    } else {
      const memory: GuestMemory = {
        id: createId(),
        ...memoryForm,
        title: memoryForm.title.trim(),
        createdAt: new Date().toISOString(),
      };
      setStore((current) => ({ ...current, memories: [memory, ...current.memories] }));
      showNotice("Memory saved 🌸");
    }

    resetMemoryForm();
  }

  function deleteMemory(id: string) {
    if (!window.confirm("Delete this demo memory?")) return;
    setStore((current) => ({
      ...current,
      memories: current.memories.filter((memory) => memory.id !== id),
    }));
    if (memoryEditing?.id === id) resetMemoryForm();
    showNotice("Memory removed.");
  }

  async function handleDreamImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotice("Guest images must be smaller than 3 MB.");
      return;
    }
    const image = await readImage(file);
    setDreamForm((current) => ({ ...current, image }));
  }

  async function handleMemoryImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotice("Guest images must be smaller than 3 MB.");
      return;
    }
    const image = await readImage(file);
    setMemoryForm((current) => ({ ...current, image }));
  }

  async function handleProfileImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotice("Guest images must be smaller than 3 MB.");
      return;
    }
    const image = await readImage(file);
    setProfileForm((current) => ({ ...current, image }));
  }

  function saveProfile() {
    if (!profileForm.username.trim()) {
      showNotice("Choose a username first.");
      return;
    }
    setStore((current) => ({
      ...current,
      profile: {
        ...profileForm,
        username: profileForm.username.trim(),
      },
    }));
    showNotice("Guest profile saved 🌸");
  }

  function exitGuest() {
    localStorage.removeItem(STORAGE_KEY);
    onExit();
  }

  return (
    <main className="sakuri-app guest-demo">
      <div className="background-layer" />
      <div className="background-overlay" />

      <div className="app-shell">
        <header className="app-topbar glass">
          <div className="brand">
            <img src="/logo.png" alt="Sakuri" className="brand-logo" />
            <span>Sakuri</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Guest Mode 🌸</span>
            <button
              type="button"
              className="top-profile-button"
              onClick={() => setPage("profile")}
              aria-label="Guest profile"
            >
              {store.profile.image ? (
                <img src={store.profile.image} alt={store.profile.username} />
              ) : (
                <span>♡</span>
              )}
            </button>
          </div>
        </header>

        {notice && (
          <div
            className="glass"
            style={{
              position: "fixed",
              top: 84,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              padding: "10px 16px",
              borderRadius: 14,
            }}
          >
            {notice}
          </div>
        )}

        <section className="app-content">
          {page === "home" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">Guest Mode 🌸</p>
                <h1>{greeting}, {store.profile.username}</h1>
                <p>
                  Explore Sakuri freely. Everything you create here is temporary demo data.
                </p>
              </div>

              <div className="home-cards">
                <button type="button" className="glass feature-card" onClick={() => setPage("dreams")}>
                  <span className="feature-icon">♡</span>
                  <strong>Dreams</strong>
                  <span>Create, edit and delete demo dreams.</span>
                </button>
                <button type="button" className="glass feature-card" onClick={() => setPage("memories")}>
                  <span className="feature-icon">✿</span>
                  <strong>Memories</strong>
                  <span>Keep temporary demo memories and pictures.</span>
                </button>
              </div>
            </div>
          )}

          {page === "dreams" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">Guest Dreams ♡</p>
                <h1>Your little dreams</h1>
                <p>These are stored only in this browser's Guest Mode.</p>
              </div>

              <section className="guest-form-card glass">
                <div className="guest-form-heading">
                  <div>
                    <p className="eyebrow">{dreamEditing ? "Guest Dreams ♡" : "A new little dream ♡"}</p>
                    <h2>{dreamEditing ? "Edit your dream" : "Create a dream"}</h2>
                  </div>
                  <span className="guest-form-sparkle">🌸</span>
                </div>

                <div className="guest-form-stack">
                  <label className="guest-field">
                    <span>Dream title</span>
                    <input
                      value={dreamForm.title}
                      onChange={(e) => setDreamForm({ ...dreamForm, title: e.target.value })}
                      placeholder="What do you want to achieve?"
                      maxLength={120}
                    />
                  </label>

                  <label className="guest-field">
                    <span>Description</span>
                    <textarea
                      value={dreamForm.description}
                      onChange={(e) => setDreamForm({ ...dreamForm, description: e.target.value })}
                      placeholder="Tell your future self a little more..."
                      rows={5}
                      maxLength={1000}
                    />
                  </label>

                  <div className="guest-field-grid">
                    <label className="guest-field">
                      <span>Target date</span>
                      <input
                        type="date"
                        value={dreamForm.targetDate}
                        onChange={(e) => setDreamForm({ ...dreamForm, targetDate: e.target.value })}
                      />
                    </label>

                    <label className="guest-field">
                      <span>Location</span>
                      <input
                        value={dreamForm.location}
                        onChange={(e) => setDreamForm({ ...dreamForm, location: e.target.value })}
                        placeholder="Where?"
                        maxLength={120}
                      />
                    </label>
                  </div>

                  <div className="guest-field-grid">
                    <label className="guest-field">
                      <span>Status</span>
                      <select
                        value={dreamForm.status}
                        onChange={(e) =>
                          setDreamForm({
                            ...dreamForm,
                            status: e.target.value as GuestDream["status"],
                          })
                        }
                      >
                        <option value="dreaming">Dreaming</option>
                        <option value="planning">Planning</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>

                    <label className="guest-check-field">
                      <input
                        type="checkbox"
                        checked={dreamForm.isPrivate}
                        onChange={(e) =>
                          setDreamForm({
                            ...dreamForm,
                            isPrivate: e.target.checked,
                          })
                        }
                      />
                      <span>Private dream ⭐</span>
                    </label>
                  </div>

                  <label className="guest-file-field">
                    <span className="guest-file-label">Dream picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleDreamImage(e.target.files?.[0])}
                    />
                    <small>Optional · JPG, PNG or WebP · max 3 MB</small>
                  </label>

                  {dreamForm.image && (
                    <div className="guest-image-preview">
                      <img src={dreamForm.image} alt="Dream preview" />
                    </div>
                  )}

                  <div className="guest-form-actions">
                    <button type="button" className="primary-button" onClick={saveDream}>
                      {dreamEditing ? "Save changes" : "Create Dream 🌸"}
                    </button>
                    {dreamEditing && (
                      <button type="button" className="secondary-button" onClick={resetDreamForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <div className="guest-item-list">
                {store.dreams.length === 0 ? (
                  <div className="glass empty-state"><span>♡</span><h2>No demo dreams yet</h2><p>Create your first one above.</p></div>
                ) : store.dreams.map((dream) => (
                  <article key={dream.id} className="guest-item-card glass">
                    {dream.image && <img src={dream.image} alt={dream.title} className="guest-item-image" />}
                    <p className="eyebrow">{dream.status} {dream.isPrivate ? "⭐" : ""}</p>
                    <h2 style={{ margin: "4px 0" }}>{dream.title}</h2>
                    {dream.description && <p>{dream.description}</p>}
                    {(dream.targetDate || dream.location) && <small>{dream.targetDate}{dream.targetDate && dream.location ? " · " : ""}{dream.location}</small>}
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      <button type="button" className="secondary-button" onClick={() => startDreamEdit(dream)}>Edit</button>
                      <button type="button" className="secondary-button" onClick={() => deleteDream(dream.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {page === "memories" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">Guest Memories ✿</p>
                <h1>Little moments</h1>
                <p>Temporary demo memories stay inside Guest Mode.</p>
              </div>

              <section className="guest-form-card glass">
                <div className="guest-form-heading">
                  <div>
                    <p className="eyebrow">{memoryEditing ? "Guest Memories ✿" : "A little moment ✿"}</p>
                    <h2>{memoryEditing ? "Edit your memory" : "Create a memory"}</h2>
                  </div>
                  <span className="guest-form-sparkle">🌸</span>
                </div>

                <div className="guest-form-stack">
                  <label className="guest-field">
                    <span>Memory title</span>
                    <input
                      value={memoryForm.title}
                      onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                      placeholder="A moment worth keeping..."
                      maxLength={120}
                    />
                  </label>

                  <label className="guest-field">
                    <span>Your story</span>
                    <textarea
                      value={memoryForm.description}
                      onChange={(e) => setMemoryForm({ ...memoryForm, description: e.target.value })}
                      placeholder="What happened?"
                      rows={5}
                      maxLength={1000}
                    />
                  </label>

                  <div className="guest-field-grid">
                    <label className="guest-field">
                      <span>Memory date</span>
                      <input
                        type="date"
                        value={memoryForm.memoryDate}
                        onChange={(e) => setMemoryForm({ ...memoryForm, memoryDate: e.target.value })}
                      />
                    </label>

                    <label className="guest-field">
                      <span>Location</span>
                      <input
                        value={memoryForm.location}
                        onChange={(e) => setMemoryForm({ ...memoryForm, location: e.target.value })}
                        placeholder="Where did it happen?"
                        maxLength={120}
                      />
                    </label>
                  </div>

                  <label className="guest-file-field">
                    <span className="guest-file-label">Memory picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleMemoryImage(e.target.files?.[0])}
                    />
                    <small>Optional · JPG, PNG or WebP · max 3 MB</small>
                  </label>

                  {memoryForm.image && (
                    <div className="guest-image-preview">
                      <img src={memoryForm.image} alt="Memory preview" />
                    </div>
                  )}

                  <div className="guest-form-actions">
                    <button type="button" className="primary-button" onClick={saveMemory}>
                      {memoryEditing ? "Save changes" : "Create Memory ✿"}
                    </button>
                    {memoryEditing && (
                      <button type="button" className="secondary-button" onClick={resetMemoryForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <div className="guest-item-list">
                {store.memories.length === 0 ? (
                  <div className="glass empty-state"><span>✿</span><h2>No demo memories yet</h2><p>Create your first one above.</p></div>
                ) : store.memories.map((memory) => (
                  <article key={memory.id} className="guest-item-card glass">
                    {memory.image && <img src={memory.image} alt={memory.title} className="guest-item-image" />}
                    <h2 style={{ margin: "4px 0" }}>{memory.title}</h2>
                    {memory.description && <p>{memory.description}</p>}
                    {(memory.memoryDate || memory.location) && <small>{memory.memoryDate}{memory.memoryDate && memory.location ? " · " : ""}{memory.location}</small>}
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      <button type="button" className="secondary-button" onClick={() => startMemoryEdit(memory)}>Edit</button>
                      <button type="button" className="secondary-button" onClick={() => deleteMemory(memory.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {page === "profile" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">Guest Profile ♡</p>
                <h1>Make your demo space yours</h1>
              </div>
              <section className="guest-form-card glass">
                <div className="guest-form-heading">
                  <div>
                    <p className="eyebrow">Guest Profile ♡</p>
                    <h2>Your little space</h2>
                  </div>
                  <span className="guest-form-sparkle">🌸</span>
                </div>

                <div className="guest-profile-layout">
                  <label className="guest-profile-upload">
                    {profileForm.image ? (
                      <img src={profileForm.image} alt="Guest preview" />
                    ) : (
                      <span>♡<small>Add picture</small></span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleProfileImage(e.target.files?.[0])}
                    />
                  </label>

                  <div className="guest-form-stack">
                    <label className="guest-field">
                      <span>Username</span>
                      <input
                        value={profileForm.username}
                        maxLength={40}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            username: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="guest-field">
                      <span>Description</span>
                      <textarea
                        value={profileForm.description}
                        maxLength={300}
                        rows={4}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>

                    <button type="button" className="primary-button" onClick={saveProfile}>
                      Save profile 🌸
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {page === "settings" && (
            <div className="home-page">
              <div className="welcome-card glass">
                <p className="eyebrow">Guest Settings ⚙</p>
                <h1>Demo space</h1>
                <p>No email, PIN, OTP or real account is attached to Guest Mode.</p>
              </div>
              <div className="guest-settings-card glass">
                <h2 style={{ marginTop: 0 }}>Guest Mode 🌸</h2>
                <p>Everything you've created here is temporary browser data and never becomes a private Sakuri account.</p>
                <button type="button" className="secondary-button" onClick={exitGuest}>Exit Guest</button>
              </div>
            </div>
          )}
        </section>

        <nav className="desktop-navigation glass">
          {(["home", "dreams", "memories", "profile", "settings"] as GuestPage[]).map((item) => (
            <button key={item} type="button" className={page === item ? "active" : ""} onClick={() => setPage(item)}>
              <span>{item === "home" ? "⌂" : item === "dreams" ? "♡" : item === "memories" ? "✿" : item === "profile" ? "○" : "⚙"}</span>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <nav className="mobile-navigation glass">
          {(["home", "dreams", "memories", "profile", "settings"] as GuestPage[]).map((item) => (
            <button key={item} type="button" className={page === item ? "active" : ""} onClick={() => setPage(item)}>
              <span>{item === "home" ? "⌂" : item === "dreams" ? "♡" : item === "memories" ? "✿" : item === "profile" ? "○" : "⚙"}</span>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

export default GuestDemo;
