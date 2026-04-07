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

type ScoreResponse = {
  jobs: Job[];
  explanation: string;
};

type ResumePreview = {
  characters: number;
  preview: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  keywords: string[];
  experience_titles: string[];
  companies: string[];
  date_ranges: string[];
  education: string;
  skills_section: string;
  experience_section: string;
  projects_section: string;
  courses: string[];
};

const API_BASE_URL = "";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scoredJobs, setScoredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [minScore, setMinScore] = useState(70);
  const [resultLimit, setResultLimit] = useState(15);
  const hasAutoScraped = useRef(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [scoreStatus, setScoreStatus] = useState<string | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);

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
      const withDefaultScores = (data as Job[]).map((job) => ({
        ...job,
        match_score: 0,
      }));
      setJobs(withDefaultScores);
      setScoredJobs(withDefaultScores);
      setHasScored(false);
      setScoreExplanation(null);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const parseResume = async () => {
    if (!resumeFile) {
      setPreviewStatus("Please upload a resume first.");
      return;
    }

    setPreviewStatus("Parsing resume...");
    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });
      const data: ResumePreview = await response.json();
      setResumePreview(data);
      setPreviewStatus("Resume parsed. Review the preview below.");
      await scoreJobs();
    } catch (error) {
      console.error("Failed to parse resume", error);
      setPreviewStatus("Failed to parse resume. Check backend logs.");
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
      const response = await fetch(
        `${API_BASE_URL}/api/jobs/score?${queryParams}&limit=${resultLimit}`,
        {
        method: "POST",
        body: formData,
        }
      );
      const data: ScoreResponse = await response.json();
      setScoredJobs(data.jobs);
      setJobs(data.jobs.filter((job) => job.match_score >= minScore));
      setScoreExplanation(data.explanation);
      setHasScored(true);
      setScoreStatus(`Showing top ${resultLimit} matches.`);
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

  useEffect(() => {
    if (!hasScored) {
      return;
    }
    setJobs(scoredJobs.filter((job) => job.match_score >= minScore));
  }, [minScore, scoredJobs, hasScored]);

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
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">
              Results to Show
            </label>
            <select
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              value={resultLimit}
              onChange={(event) => setResultLimit(Number(event.target.value))}
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
              className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
              onClick={parseResume}
            >
              Preview Resume
            </button>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
              onClick={scoreJobs}
            >
              Score Jobs
            </button>
          </div>
        </section>

        {previewStatus && (
          <p className="mt-2 text-sm text-slate-500">{previewStatus}</p>
        )}

        {resumePreview && (
          <div className="mt-2 rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="text-xs uppercase text-slate-500">Resume Preview</p>
            <p className="mt-1 text-xs text-slate-500">
              Characters parsed: {resumePreview.characters}
            </p>
            {(resumePreview.name || resumePreview.email || resumePreview.phone) && (
              <div className="mt-2">
                <p className="text-xs uppercase text-slate-500">Contact</p>
                <p className="mt-1 text-sm">
                  {resumePreview.name && <span>{resumePreview.name}</span>}
                  {resumePreview.email && (
                    <span className="ml-2">{resumePreview.email}</span>
                  )}
                  {resumePreview.phone && (
                    <span className="ml-2">{resumePreview.phone}</span>
                  )}
                </p>
              </div>
            )}
            {(resumePreview.linkedin || resumePreview.github) && (
              <div className="mt-2">
                <p className="text-xs uppercase text-slate-500">Profiles</p>
                <p className="mt-1 text-sm">
                  {resumePreview.linkedin && (
                    <span className="mr-2">{resumePreview.linkedin}</span>
                  )}
                  {resumePreview.github && <span>{resumePreview.github}</span>}
                </p>
              </div>
            )}
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {resumePreview.preview}
            </p>
            {resumePreview.keywords?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Keywords</p>
                <p className="mt-1 text-sm">{resumePreview.keywords.join(", ")}</p>
              </div>
            )}
            {resumePreview.experience_titles?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Experience Titles</p>
                <p className="mt-1 text-sm">{resumePreview.experience_titles.join(", ")}</p>
              </div>
            )}
            {resumePreview.companies?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Companies</p>
                <p className="mt-1 text-sm">{resumePreview.companies.join(", ")}</p>
              </div>
            )}
            {resumePreview.date_ranges?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Date Ranges</p>
                <p className="mt-1 text-sm">{resumePreview.date_ranges.join(", ")}</p>
              </div>
            )}
            {resumePreview.skills_section && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Skills Section</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {resumePreview.skills_section}
                </p>
              </div>
            )}
            {resumePreview.experience_section && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Experience Section</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {resumePreview.experience_section}
                </p>
              </div>
            )}
            {resumePreview.projects_section && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Projects Section</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {resumePreview.projects_section}
                </p>
              </div>
            )}
            {resumePreview.courses?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Relevant Courses</p>
                <p className="mt-1 text-sm">{resumePreview.courses.join(", ")}</p>
              </div>
            )}
            {resumePreview.education && (
              <div className="mt-4">
                <p className="text-xs uppercase text-slate-500">Education Section</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {resumePreview.education}
                </p>
              </div>
            )}
          </div>
        )}

        {scoreStatus && (
          <p className="mt-2 text-sm text-slate-500">{scoreStatus}</p>
        )}

        {!hasScored && (
          <p className="mt-2 text-sm text-slate-500">
            Upload a resume to compute match scores. Scores default to 0 until then.
          </p>
        )}

        {hasScored && scoreExplanation && (
          <p className="mt-2 text-sm text-slate-500">{scoreExplanation}</p>
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