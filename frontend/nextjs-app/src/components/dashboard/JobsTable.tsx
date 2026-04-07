import type { Job } from "@/types/jobs";

type JobsTableProps = {
  jobs: Job[];
  loading: boolean;
};

export default function JobsTable({ jobs, loading }: JobsTableProps) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Internships</h2>
        <span className="text-sm text-slate-600">
          {loading ? "Loading..." : `${jobs.length} results`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Match Score</th>
              <th className="px-4 py-3">Date Posted</th>
              <th className="px-4 py-3">Apply</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={`${job.company}-${job.url}`} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{job.company}</td>
                <td className="px-4 py-3">{job.role}</td>
                <td className="px-4 py-3">{job.location}</td>
                <td className="px-4 py-3">{job.match_score.toFixed(1)}</td>
                <td className="px-4 py-3">{job.date_posted}</td>
                <td className="px-4 py-3">
                  <a
                    className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
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