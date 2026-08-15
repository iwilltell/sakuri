const MUSIC_KEY =
  "sakuri_music_enabled";

const SOUND_KEY =
  "sakuri_touch_sounds_enabled";

const MUSIC_EVENT =
  "sakuri:music-setting";

let music: HTMLAudioElement | null = null;

let musicStarted = false;

function getStoredBoolean(
  key: string,
  defaultValue: boolean,
): boolean {
  const value =
    localStorage.getItem(key);

  if (value === null) {
    return defaultValue;
  }

  return value === "true";
}

export function isMusicEnabled(): boolean {
  return getStoredBoolean(
    MUSIC_KEY,
    false,
  );
}

export function isTouchSoundEnabled(): boolean {
  return getStoredBoolean(
    SOUND_KEY,
    true,
  );
}

export function setMusicEnabled(
  enabled: boolean,
): void {
  localStorage.setItem(
    MUSIC_KEY,
    String(enabled),
  );

  window.dispatchEvent(
    new CustomEvent(
      MUSIC_EVENT,
      {
        detail: enabled,
      },
    ),
  );

  if (!enabled) {
    stopMusic();
  }
}

export function setTouchSoundEnabled(
  enabled: boolean,
): void {
  localStorage.setItem(
    SOUND_KEY,
    String(enabled),
  );
}

function createMusic(): HTMLAudioElement {
  if (!music) {
    music = new Audio(
      "/audio/background-music.mp3",
    );

    music.loop = true;
    music.volume = 0.1;
    music.preload = "auto";
  }

  return music;
}

export async function startMusic(): Promise<void> {
  if (!isMusicEnabled()) {
    return;
  }

  const audio =
    createMusic();

  if (
    musicStarted &&
    !audio.paused
  ) {
    return;
  }

  try {
    await audio.play();

    musicStarted = true;
  } catch {
    // Browser/Android autoplay
    // restrictions can block playback.
  }
}

export function stopMusic(): void {
  if (!music) {
    return;
  }

  music.pause();
  music.currentTime = 0;
  musicStarted = false;
}

export function playTouchSound(): void {
  if (!isTouchSoundEnabled()) {
    return;
  }

  const sound =
    new Audio(
      "/audio/touch-click.mp3",
    );

  sound.volume = 0.22;

  sound.play().catch(() => {
    // Ignore browser audio errors.
  });
}

if (
  typeof window !== "undefined"
) {
  window.addEventListener(
    "pointerdown",
    () => {
      void startMusic();
    },
    {
      passive: true,
    },
  );

  window.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as
          | HTMLElement
          | null;

      if (
        target?.closest(
          "button, a, [role='button'], input, textarea, select",
        )
      ) {
        playTouchSound();
      }
    },
    {
      passive: true,
    },
  );

  window.addEventListener(
    MUSIC_EVENT,
    (event) => {
      const enabled =
        (
          event as CustomEvent<boolean>
        ).detail;

      if (enabled) {
        void startMusic();
      }
    },
  );
}