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
  const locationSuggestions = [
    "Remote",
    "New York, NY",
    "San Francisco, CA",
    "Seattle, WA",
    "Austin, TX",
    "Boston, MA",
    "Chicago, IL",
    "Los Angeles, CA",
    "Atlanta, GA",
    "Raleigh, NC",
    "Denver, CO",
    "Portland, OR",
    "Phoenix, AZ",
    "Washington, DC",
  ];

  const locationDatalistId = "location-suggestions";

  return (
    <section className="editorial-panel text-center">
      <div className="flex flex-col items-center gap-3">
        <div>
          <p className="section-title">Filter Stack</p>
          <p className="mt-1 text-sm text-[var(--ink-500)]">
            Tune the signal before you score.
          </p>
        </div>
        <div className="data-chip">Smart filters engaged</div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="input-shell">
          <label className="input-label">Job Title</label>
          <input
            className="input-field"
            placeholder="SWE, ML, AI"
            value={jobTitle}
            onChange={(event) => onJobTitleChange(event.target.value)}
          />
        </div>
        <div className="input-shell">
          <label className="input-label">Location</label>
          <input
            className="input-field"
            placeholder="Remote, NYC, etc."
            list={locationDatalistId}
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
          />
          <datalist id={locationDatalistId}>
            {locationSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>
        <div className="input-shell">
          <label className="input-label">Minimum Match Score: {minScore}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(event) => onMinScoreChange(Number(event.target.value))}
            className="range-field"
          />
          <div className="flex justify-between text-[0.7rem] text-[var(--ink-300)]">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </section>
  );
}