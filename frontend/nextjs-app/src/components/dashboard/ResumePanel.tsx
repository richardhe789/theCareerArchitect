import { useRef } from "react";

type ResumePanelProps = {
  resumeFile: File | null;
  resultLimit: number;
  onResumeChange: (file: File | null) => void;
  onResultLimitChange: (value: number) => void;
  onPreview: (file?: File | null) => void;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleResumeSelect = async (file: File | null) => {
    onResumeChange(file);
    if (file) {
      await onPreview(file);
    }
  };

  const handleScanResume = () => {
    if (resumeFile) {
      onPreview(resumeFile);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border-2 border-dashed border-[rgba(27,77,255,0.3)] bg-white/70 p-8 text-center shadow-[0_20px_60px_rgba(15,17,21,0.12)]">
          <h3 className="text-xl font-semibold text-[var(--ink-900)]">
            Upload your resume
          </h3>
          <p className="mt-2 text-sm text-[var(--ink-500)]">
            Drag and drop your PDF or DOCX here. We’ll extract skills and score
            them instantly.
          </p>
          <button className="cta-button secondary" onClick={handleScanResume}>
            Scan Resume
          </button>
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            ref={fileInputRef}
            onChange={(event) =>
              handleResumeSelect(event.target.files?.[0] ?? null)
            }
          />
          {resumeFile && (
            <p className="mt-3 text-xs text-[var(--ink-300)]">
              Selected: {resumeFile.name}
            </p>
          )}
      </div>

      <div className="glass-card">
        <div className="text-center">
          <p className="section-title">Results to Show</p>
          <p className="mt-2 text-sm text-[var(--ink-500)]">
            Limit the shortlist length once scoring completes.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="input-shell">
            <label className="input-label">Match Limit</label>
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
          <button className="cta-button primary" onClick={() => onScore()}>
            Score Jobs
          </button>
        </div>
      </div>
    </section>
  );
}