"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Job = {
  id?: number;
  company: string;
  role: string;
  location: string;
  url: string;
  date_posted: string;
  match_score: number;
};

const API_BASE_URL = "";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [minScore, setMinScore] = useState(70);
  const hasAutoScraped = useRef(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [scoreStatus, setScoreStatus] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (jobTitle) params.append("job_title", jobTitle);
    if (location) params.append("location", location);
    if (minScore !== null) params.append("min_match_score", String(minScore));
    return params.toString();
  }, [jobTitle, location, minScore]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams}`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const scoreJobs = async () => {
    if (!resumeFile) {
      setScoreStatus("Please upload a resume first.");
      return;
    }

    setLoading(true);
    setScoreStatus("Scoring jobs against resume...");

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/score?${queryParams}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setJobs(data);
      setScoreStatus("Scores updated.");
    } catch (error) {
      console.error("Failed to score jobs", error);
      setScoreStatus("Failed to score jobs. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const runScrape = async () => {
    setScrapeStatus("Running scraper...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape`, {
        method: "POST",
      });
      const data = await response.json();
      setScrapeStatus(
        `Scrape complete: ${data.inserted} new listings (${data.total_fetched} fetched).`
      );
      await loadJobs();
    } catch (error) {
      console.error("Scrape failed", error);
      setScrapeStatus("Scrape failed. Check backend logs.");
    }
  };

  useEffect(() => {
    if (hasAutoScraped.current) {
      loadJobs();
      return;
    }

    hasAutoScraped.current = true;
    const runInitial = async () => {
      await runScrape();
    };

    runInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Local Internship Dashboard</h1>
            <p className="text-sm text-slate-500">
              Powered by SimplifyJobs + company ATS boards
            </p>
          </div>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            onClick={runScrape}
          >
            Run Scraper
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Job Title
            </label>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="SWE, ML, AI"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Location
            </label>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              placeholder="Remote, NYC, etc."
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Minimum Match Score: {minScore}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </section>

        {scrapeStatus && (
          <p className="mt-4 rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            {scrapeStatus}
          </p>
        )}

        <section className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Resume (PDF or DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.docx"
              className="mt-1 w-full"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
            {resumeFile && (
              <p className="mt-1 text-xs text-slate-500">Selected: {resumeFile.name}</p>
            )}
          </div>
          <div className="flex items-end">
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
              onClick={scoreJobs}
            >
              Score Jobs
            </button>
          </div>
        </section>

        {scoreStatus && (
          <p className="mt-2 text-sm text-slate-500">{scoreStatus}</p>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Internships</h2>
            <span className="text-sm text-slate-500">
              {loading ? "Loading..." : `${jobs.length} results`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
                  <tr key={`${job.company}-${job.url}`} className="border-t">
                    <td className="px-4 py-3 font-medium">{job.company}</td>
                    <td className="px-4 py-3">{job.role}</td>
                    <td className="px-4 py-3">{job.location}</td>
                    <td className="px-4 py-3">{job.match_score.toFixed(1)}</td>
                    <td className="px-4 py-3">{job.date_posted}</td>
                    <td className="px-4 py-3">
                      <a
                        className="rounded bg-blue-600 px-3 py-1 text-white"
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
      </main>
    </div>
  );
}