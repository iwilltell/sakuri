import "./App.css";

const WEB_APP_URL = "https://sakuri.onrender.com";

const APK_URL = "/downloads/sakuri.apk";

function App() {
  function openWebApp() {
    window.location.href = WEB_APP_URL;
  }

  function downloadApk() {
    window.location.href = APK_URL;
  }

  return (
    <main className="landing-page">
      <div className="landing-background" />
      <div className="landing-overlay" />

      <section className="landing-content">
        <div className="landing-logo-wrap">
          <img
            src="/logo.png"
            alt="Sakuri"
            className="landing-logo"
          />
        </div>

        <p className="landing-eyebrow">
          A little place for us 🌸
        </p>

        <h1>Sakuri</h1>

        <p className="landing-tagline">
          Keep your dreams close.
          <br />
          Keep your memories closer.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-primary-button"
            onClick={openWebApp}
          >
            <span>🌸</span>
            Open Sakuri
          </button>

          <button
            type="button"
            className="landing-secondary-button"
            onClick={downloadApk}
          >
            <span>📱</span>
            Download for Android
          </button>
        </div>

        <p className="landing-note">
          Available on web and Android
        </p>
      </section>

      <footer className="landing-footer">
        Made with love · Sakuri 🌸
      </footer>
    </main>
  );
}

export default App;