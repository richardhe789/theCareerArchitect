import type { ResumePreview } from "@/types/jobs";

type ResumePreviewCardProps = {
  resumePreview: ResumePreview;
};

export default function ResumePreviewCard({ resumePreview }: ResumePreviewCardProps) {
  return (
    <div className="editorial-panel text-sm text-[var(--ink-700)]">
      <div className="flex items-center justify-between">
        <p className="section-title">Resume Preview</p>
        <span className="data-chip">{resumePreview.characters} chars</span>
      </div>
      {(resumePreview.name || resumePreview.email || resumePreview.phone) && (
        <div className="mt-4">
          <p className="section-title">Contact</p>
          <p className="mt-1 text-sm">
            {resumePreview.name && <span>{resumePreview.name}</span>}
            {resumePreview.email && <span className="ml-2">{resumePreview.email}</span>}
            {resumePreview.phone && <span className="ml-2">{resumePreview.phone}</span>}
          </p>
        </div>
      )}
      {(resumePreview.linkedin || resumePreview.github) && (
        <div className="mt-4">
          <p className="section-title">Profiles</p>
          <p className="mt-1 text-sm">
            {resumePreview.linkedin && (
              <span className="mr-2">{resumePreview.linkedin}</span>
            )}
            {resumePreview.github && <span>{resumePreview.github}</span>}
          </p>
        </div>
      )}
      <p className="mt-4 whitespace-pre-wrap leading-relaxed">
        {resumePreview.preview}
      </p>
      {resumePreview.keywords?.length > 0 && (
        <div className="mt-4">
          <p className="section-title">Keywords</p>
          <p className="mt-1 text-sm">{resumePreview.keywords.join(", ")}</p>
        </div>
      )}
      {resumePreview.experience_titles?.length > 0 && (
        <div className="mt-4">
          <p className="section-title">Experience Titles</p>
          <p className="mt-1 text-sm">{resumePreview.experience_titles.join(", ")}</p>
        </div>
      )}
      {resumePreview.companies?.length > 0 && (
        <div className="mt-4">
          <p className="section-title">Companies</p>
          <p className="mt-1 text-sm">{resumePreview.companies.join(", ")}</p>
        </div>
      )}
      {resumePreview.date_ranges?.length > 0 && (
        <div className="mt-4">
          <p className="section-title">Date Ranges</p>
          <p className="mt-1 text-sm">{resumePreview.date_ranges.join(", ")}</p>
        </div>
      )}
      {resumePreview.skills_section && (
        <div className="mt-4">
          <p className="section-title">Skills Section</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {resumePreview.skills_section}
          </p>
        </div>
      )}
      {resumePreview.experience_section && (
        <div className="mt-4">
          <p className="section-title">Experience Section</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {resumePreview.experience_section}
          </p>
        </div>
      )}
      {resumePreview.projects_section && (
        <div className="mt-4">
          <p className="section-title">Projects Section</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {resumePreview.projects_section}
          </p>
        </div>
      )}
      {resumePreview.courses?.length > 0 && (
        <div className="mt-4">
          <p className="section-title">Relevant Courses</p>
          <p className="mt-1 text-sm">{resumePreview.courses.join(", ")}</p>
        </div>
      )}
      {resumePreview.education && (
        <div className="mt-4">
          <p className="section-title">Education Section</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{resumePreview.education}</p>
        </div>
      )}
    </div>
  );
}