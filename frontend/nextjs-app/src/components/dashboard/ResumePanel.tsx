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

      <div className="mx-auto max-w-2xl mt-12 overflow-hidden rounded-2xl border border-[rgba(15,17,21,0.08)] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
  {/* Modern Header - Styled as a "status bar" */}
  <div className="bg-[rgba(244,242,238,0.5)] px-6 py-3 border-b border-[rgba(15,17,21,0.06)] flex justify-between items-center">
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-400)]">Engine Configuration</p>
    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
  </div>

  <div className="p-10">
    <div className="flex flex-col md:flex-row md:items-end gap-10">
      
      {/* Dropdown Section */}
      <div className="flex-1 group">
        <label className="block text-xs font-bold text-[var(--ink-900)] uppercase tracking-tight mb-1 transition-colors group-focus-within:text-blue-600">
          Analysis Depth
        </label>
        <p className="text-sm text-[var(--ink-500)] mb-4 leading-relaxed">
          Define the maximum number of matches to rank against your profile.
        </p>
        
        <div className="relative">
          <select
            className="w-full cursor-pointer appearance-none rounded-xl border-2 border-[rgba(15,17,21,0.05)] bg-[rgba(244,242,238,0.3)] px-5 py-4 text-sm font-medium text-[var(--ink-900)] outline-none transition-all hover:border-[rgba(15,17,21,0.1)] focus:border-[var(--ink-900)] focus:ring-4 focus:ring-[rgba(15,17,21,0.03)]"
            value={resultLimit}
            onChange={(event) => onResultLimitChange(Number(event.target.value))}
          >
            <option value={10}>Top 10 Results</option>
            <option value={15}>Top 15 Results</option>
            <option value={25}>Top 25 Results</option>
            <option value={50}>Top 50 Results</option>
            <option value={100}>Top 100 Results</option>
          </select>
          
          {/* Custom Minimalist Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--ink-900)]">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Button Section */}
      <div className="flex-shrink-0">
        <button 
          className="relative w-full md:w-auto overflow-hidden rounded-xl bg-[var(--ink-900)] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(15,17,21,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_15px_25px_rgba(15,17,21,0.3)] active:translate-y-[0px] active:scale-95" 
          onClick={() => onScore()}
        >
          <span className="relative z-10">Generate Report</span>
          {/* Subtle Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
        </button>
      </div>

    </div>
  </div>
</div>
    </section>
  );
}