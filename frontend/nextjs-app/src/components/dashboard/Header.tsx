type HeaderProps = {
  onRunScrape: () => void;
};

export default function Header({ onRunScrape }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Local Internship Dashboard</h1>
          <p className="text-sm text-slate-600">
            Powered by SimplifyJobs + company ATS boards
          </p>
        </div>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          onClick={onRunScrape}
        >
          Run Scraper
        </button>
      </div>
    </header>
  );
}