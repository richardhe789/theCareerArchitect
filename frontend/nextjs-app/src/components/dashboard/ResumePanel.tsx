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
    <section className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:grid-cols-[1fr_auto]">
      <div>
        <label className="text-xs font-semibold uppercase text-slate-600">
          Resume (PDF or DOCX)
        </label>
        <input
          type="file"
          accept=".pdf,.docx"
          className="mt-1 w-full text-slate-700"
          onChange={(event) => onResumeChange(event.target.files?.[0] ?? null)}
        />
        {resumeFile && (
          <p className="mt-1 text-xs text-slate-500">Selected: {resumeFile.name}</p>
        )}
        <label className="mt-3 block text-xs font-semibold uppercase text-slate-600">
          Results to Show
        </label>
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
      <div className="flex flex-col items-end gap-2">
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-100"
          onClick={onPreview}
        >
          Preview Resume
        </button>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          onClick={onScore}
        >
          Score Jobs
        </button>
      </div>
    </section>
  );
}