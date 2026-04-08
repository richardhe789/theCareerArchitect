import type { Job } from "@/types/jobs";

type JobsTableProps = {
  jobs: Job[];
  loading: boolean;
};

export default function JobsTable({ jobs, loading }: JobsTableProps) {
  return (
    <section className="table-shell">
      <div className="flex items-center justify-between border-b border-[rgba(15,17,21,0.1)] px-5 py-4">
        <div>
          <p className="section-title">Internship Feed</p>
          <p className="mt-1 text-sm text-[var(--ink-500)]">
            {loading ? "Scanning live boards..." : `${jobs.length} listings found`}
          </p>
        </div>
        <span className="data-chip">Curated signals</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table-fixed text-left">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Location</th>
              <th>Match Score</th>
              <th>Date Posted</th>
              <th>Apply</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={`${job.company}-${job.url}`}>
                <td className="font-semibold text-[var(--ink-900)]">
                  <span className="block max-w-[14rem] truncate">{job.company}</span>
                </td>
                <td>
                  <span className="block max-w-[16rem] truncate">{job.role}</span>
                </td>
                <td>
                  <span className="block max-w-[12rem] truncate">{job.location}</span>
                </td>
                <td className="font-semibold text-[var(--accent-500)]">
                  {job.match_score.toFixed(1)}
                </td>
                <td>
                  <span className="block max-w-[10rem] truncate">{job.date_posted}</span>
                </td>
                <td>
                  <a
                    className="pill-button"
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}