type HeaderProps = {
  onRunScrape: () => void;
};

export default function Header({ onRunScrape }: HeaderProps) {
  return (
  <header className="border-b border-[rgba(15,17,21,0.08)] bg-[rgba(244,242,238,0.6)] backdrop-blur">
    {/* Changed to flex-row and justify-between to push content to the edges */}
    <div className="mx-auto flex max-w-6xl flex-row items-center justify-between gap-4 px-6 py-6">
      
      {/* Text Group: Aligning text to the left for a cleaner look */}
      <div className="text-left">
        <p className="section-title text-xs uppercase tracking-wider">The Career Architect</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--ink-900)]">
          Local Internship Intelligence
        </h1>
        <p className="text-sm text-[var(--ink-500)]">
          Powered by SimplifyJobs, ATS boards, and resume scoring.
        </p>
      </div>

      {/* Button Group: Stays on the right */}
      <div className="flex-shrink-0">
        <button className="cta-button secondary" onClick={onRunScrape}>
          Run Scraper
        </button>
      </div>
      
    </div>
  </header>
);
}