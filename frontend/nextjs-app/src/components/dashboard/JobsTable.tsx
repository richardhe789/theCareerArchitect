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
              <tr key={`${job.company}-${job.url}`} className="border-t border-slate-200 h-14">
                <td className="px-4 py-3 font-medium align-middle">
                  <span className="block max-w-[14rem] truncate">{job.company}</span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="block max-w-[16rem] truncate">{job.role}</span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="block max-w-[12rem] truncate">{job.location}</span>
                </td>
                <td className="px-4 py-3 align-middle">{job.match_score.toFixed(1)}</td>
                <td className="px-4 py-3 align-middle">
                  <span className="block max-w-[10rem] truncate">{job.date_posted}</span>
                </td>
                <td className="px-4 py-3 align-middle">
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