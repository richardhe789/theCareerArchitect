type ResumePanelProps = {
  resumeFile: File | null;
  resultLimit: number;
  onResumeChange: (file: File | null) => void;
  onResultLimitChange: (value: number) => void;
  onPreview: () => void;
  onScore: () => void;
};

export default function ResumePanel({
  resumeFile,
  resultLimit,
  onResumeChange,
  onResultLimitChange,
  onPreview,
  onScore,
}: ResumePanelProps) {
  return (
    <section className="glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Resume Console</p>
          <p className="mt-2 text-sm text-[var(--ink-500)]">
            Feed the scoring engine and generate a curated shortlist.
          </p>
        </div>
        <span className="data-chip">Live scan</span>
      </div>
      <div className="mt-6 space-y-4">
        <div className="input-shell">
          <label className="input-label">Resume (PDF or DOCX)</label>
          <input
            type="file"
            accept=".pdf,.docx"
            className="input-field"
            onChange={(event) => onResumeChange(event.target.files?.[0] ?? null)}
          />
          {resumeFile && (
            <p className="text-xs text-[var(--ink-300)]">
              Selected: {resumeFile.name}
            </p>
          )}
        </div>
        <div className="input-shell">
          <label className="input-label">Results to Show</label>
          <select
            className="select-field"
            value={resultLimit}
            onChange={(event) => onResultLimitChange(Number(event.target.value))}
          >
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="cta-button secondary" onClick={() => onPreview()}>
            Preview Resume
          </button>
          <button className="cta-button primary" onClick={() => onScore()}>
            Score Jobs
          </button>
        </div>
      </div>
    </section>
  );
}