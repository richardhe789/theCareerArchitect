type FiltersPanelProps = {
  jobTitle: string;
  location: string;
  minScore: number;
  onJobTitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onMinScoreChange: (value: number) => void;
};

export default function FiltersPanel({
  jobTitle,
  location,
  minScore,
  onJobTitleChange,
  onLocationChange,
  onMinScoreChange,
}: FiltersPanelProps) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:grid-cols-3">
      <div>
        <label className="text-xs font-semibold uppercase text-slate-600">Job Title</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          placeholder="SWE, ML, AI"
          value={jobTitle}
          onChange={(event) => onJobTitleChange(event.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-600">Location</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          placeholder="Remote, NYC, etc."
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-600">
          Minimum Match Score: {minScore}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(event) => onMinScoreChange(Number(event.target.value))}
          className="mt-2 w-full"
        />
      </div>
    </section>
  );
}