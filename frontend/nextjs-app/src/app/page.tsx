export default function Home() {
  return (
    <div className="career-shell">
      <nav className="top-nav">
        <div className="top-nav__brand">The Career Architect</div>
        <div className="top-nav__links">
          <span className="top-nav__link">Explore</span>
          <span className="top-nav__link">Resources</span>
          <button className="top-nav__cta">Apply Now</button>
        </div>
      </nav>

      <aside className="side-nav">
        <div className="side-nav__header">
          <div className="side-nav__title">Architect Workspace</div>
          <div className="side-nav__subtitle">AI-Powered Career Hub</div>
        </div>
        <div className="side-nav__links">
          <a className="side-nav__link side-nav__link--active" href="#">
            <span className="material-symbols-outlined">edit_note</span>
            Build
          </a>
          <a className="side-nav__link" href="#">
            <span className="material-symbols-outlined">sync_alt</span>
            Sync
          </a>
          <a className="side-nav__link" href="#">
            <span className="material-symbols-outlined">auto_awesome</span>
            Matches
          </a>
          <a className="side-nav__link" href="#">
            <span className="material-symbols-outlined">person</span>
            Profile
          </a>
        </div>
        <div className="side-nav__footer">
          <button className="side-nav__upgrade">Upgrade to Pro</button>
          <a className="side-nav__help" href="#">
            <span className="material-symbols-outlined">help</span>
            Help
          </a>
          <a className="side-nav__help" href="#">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </a>
        </div>
      </aside>

      <main className="content-shell">
        <header className="hero-header">
          <div>
            <div className="hero-label">Onboarding Experience</div>
            <h1 className="hero-title">Craft your professional blueprint.</h1>
            <p className="hero-description">
              Let&apos;s begin by cataloging your expertise. Your resume acts as the
              foundational structure for our AI matching engine.
            </p>
          </div>
          <div className="hero-progress">
            <span>Step 1 of 3</span>
            <div className="progress-track">
              <div className="progress-fill" />
            </div>
          </div>
        </header>

        <div className="content-grid">
          <section className="content-stack">
            <div className="card upload-card">
              <div className="upload-content">
                <div className="upload-icon">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <h3 className="upload-title">Upload your resume</h3>
                <p className="upload-description">
                  Drag and drop your PDF or DOCX file here. AI will extract your
                  skills automatically.
                </p>
                <button className="upload-button">Select File</button>
              </div>
            </div>

            <div className="card interest-card">
              <h3 className="card-title">
                <span className="material-symbols-outlined">psychology</span>
                Career Interests
              </h3>
              <label className="card-label">What is your ideal career trajectory?</label>
              <textarea
                className="card-textarea"
                placeholder="Describe the roles, industries, and impact you want to have in your next position..."
              />
            </div>
          </section>

          <aside className="content-stack">
            <div className="card tag-card">
              <h3 className="card-title">
                <span className="material-symbols-outlined">local_offer</span>
                Expertise &amp; Interests
              </h3>
              <p className="hero-description">
                Tags help our matching engine prioritize the right internship
                opportunities for you.
              </p>
              <div className="tag-list">
                <div className="tag-pill">
                  UI/UX Design <span className="material-symbols-outlined">close</span>
                </div>
                <div className="tag-pill">
                  React <span className="material-symbols-outlined">close</span>
                </div>
                <div className="tag-pill">
                  Figma <span className="material-symbols-outlined">close</span>
                </div>
                <div className="tag-pill">
                  Strategy <span className="material-symbols-outlined">close</span>
                </div>
              </div>
              <div className="tag-input">
                <span className="material-symbols-outlined">add</span>
                <input type="text" placeholder="Add a skill..." />
              </div>
              <div className="suggestions">
                <div className="suggestions-title">Suggested for you</div>
                <div className="tag-list">
                  <button className="suggestion-chip">+ TypeScript</button>
                  <button className="suggestion-chip">+ Python</button>
                  <button className="suggestion-chip">+ Product Management</button>
                </div>
              </div>
            </div>

            <div className="card insight-card">
              <h3 className="upload-title">Curator Insights</h3>
              <p className="upload-description">
                Users who upload a detailed resume see a 40% increase in high-quality
                matches during their first week.
              </p>
              <img
                className="insight-image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTTv-3iEb3vBgFMDXgdabvdOeJX2UP0wlGmT-ipv1WzahnCgiw6-fP7KyJRSFcrYYNrICm-JpjD1_Cdx9Ot3frFXL0lHm1rrKxurdqdCZm6Ic2sNmofo9crtch_TqdGVkjOa5Zd0H8Enhyog1dmwACOPLyX4UE1Xl3zO2NxZ56Tp5HAVO0u_C63093vWljvV6VaSEBK5vBz08e3ff3q86MHEpxKPTsYrmmIWiEcltw3tk54c9Grwt7mEkN6-U-CDF45yqP3zkfB38"
                alt="modern office environment with soft focus desk setup and warm cinematic lighting showing professional focus"
              />
              <div className="insight-glow" />
            </div>
          </aside>
        </div>

        <footer className="footer-actions">
          <button className="footer-secondary">
            <span className="material-symbols-outlined">arrow_back</span>
            Previous Step
          </button>
          <button className="footer-primary">
            Continue to Sync
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </footer>
      </main>

      <div className="mobile-only">
        <button className="fab">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}