type HeaderProps = {
  onRunScrape: () => void;
};

export default function Header({ onRunScrape }: HeaderProps) {
  return (
    <header className="border-b border-[rgba(15,17,21,0.08)] bg-[rgba(244,242,238,0.6)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="section-title">The Career Architect</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--ink-900)]">
            Local Internship Intelligence
          </h1>
          <p className="text-sm text-[var(--ink-500)]">
            Powered by SimplifyJobs, ATS boards, and resume scoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="cta-button secondary" onClick={onRunScrape}>
            Run Scraper
          </button>
          <button className="cta-button primary">Brief Preview</button>
        </div>
      </div>
    </header>
  );
}