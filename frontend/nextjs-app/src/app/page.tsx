"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FiltersPanel from "@/components/dashboard/FiltersPanel";
import Header from "@/components/dashboard/Header";
import JobsTable from "@/components/dashboard/JobsTable";
import ResumePanel from "@/components/dashboard/ResumePanel";
import ResumePreviewCard from "@/components/dashboard/ResumePreviewCard";
import StatusMessage from "@/components/dashboard/StatusMessage";
import type { Job, ResumePreview } from "@/types/jobs";

type ScoreResponse = {
  jobs: Job[];
  explanation: string;
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
    return params.toString();
  }, [jobTitle, location]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams}`);
      const data = await response.json();
      const withDefaultScores = (data as Job[]).map((job) => ({
        ...job,
        match_score: 0,
      }));
      if (resumeFile && hasScored && scoredJobs.length > 0) {
        setJobs(scoredJobs.filter((job) => job.match_score >= minScore));
      } else {
        setJobs(withDefaultScores);
        setScoredJobs(withDefaultScores);
        setHasScored(false);
        setScoreExplanation(null);
      }
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const parseResume = async (fileOverride?: File | null) => {
    const activeFile = fileOverride ?? resumeFile;
    if (!activeFile) {
      setPreviewStatus("Please upload a resume first.");
      return;
    }

    setPreviewStatus("Parsing resume...");
    const formData = new FormData();
    formData.append("file", activeFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });
      const data: ResumePreview = await response.json();
      setResumePreview(data);
      setPreviewStatus("Resume parsed. Review the preview below.");
      await scoreJobs(activeFile);
    } catch (error) {
      console.error("Failed to parse resume", error);
      setPreviewStatus("Failed to parse resume. Check backend logs.");
    }
  };

  const scoreJobs = async (fileOverride?: File | null) => {
    const activeFile = fileOverride ?? resumeFile;
    if (!activeFile) {
      setScoreStatus("Please upload a resume first.");
      return;
    }

    setLoading(true);
    setScoreStatus("Scoring jobs against resume...");

    const formData = new FormData();
    formData.append("file", activeFile);

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

  useEffect(() => {
    if (resumeFile) {
      return;
    }
    setHasScored(false);
    setScoreExplanation(null);
    setJobs((prev) => prev.map((job) => ({ ...job, match_score: 0 })));
    setScoredJobs((prev) => prev.map((job) => ({ ...job, match_score: 0 })));
  }, [resumeFile]);

  return (
    <div className="editorial-shell">
      <div className="editorial-content">
        <Header onRunScrape={runScrape} />

        <main className="mx-auto max-w-6xl px-6 py-12">
          <section className="mx-auto flex max-w-5xl flex-col gap-6 text-center lg:flex-col lg:items-center">
            <div className="max-w-2xl">
              <span className="eyebrow stagger-fade">Resume Intelligence</span>
              <h1 className="headline-display stagger-fade delay-1">
                Architect the internship search that reads like a headline.
              </h1>
              <p className="lede stagger-fade delay-2">
                Upload once, scan fast. The dashboard triangulates your resume,
                internship supply, and match scores into an editorial-grade brief.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="data-chip">Auto-scan ATS boards</span>
                <span className="data-chip">Score the top {resultLimit}</span>
                <span className="data-chip">Threshold {minScore}%+</span>
              </div>
            </div>
            <div className="glass-card mx-auto max-w-sm stagger-fade delay-3">
              <p className="section-title">Live Status</p>
              <p className="mt-3 text-sm text-[var(--ink-500)]">
                {scrapeStatus ?? "Awaiting scrape. Launch to refresh boards."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="cta-button primary" onClick={runScrape}>
                  Refresh Listings
                </button>
                <button
                  className="cta-button secondary"
                  onClick={() => parseResume()}
                >
                  Scan Resume
                </button>
              </div>
            </div>
          </section>

          <div className="mx-auto mt-10 grid max-w-5xl gap-6">
            <ResumePanel
              resumeFile={resumeFile}
              resultLimit={resultLimit}
              onResumeChange={setResumeFile}
              onResultLimitChange={setResultLimit}
              onPreview={parseResume}
              onScore={scoreJobs}
            />

            {previewStatus && <StatusMessage text={previewStatus} />}

            {resumePreview && <ResumePreviewCard resumePreview={resumePreview} />}

            {scoreStatus && <StatusMessage text={scoreStatus} />}

            {!hasScored && (
              <StatusMessage text="Upload a resume to compute match scores. Scores default to 0 until then." />
            )}

            {hasScored && scoreExplanation && (
              <StatusMessage text={scoreExplanation} />
            )}

            <FiltersPanel
              jobTitle={jobTitle}
              location={location}
              minScore={minScore}
              onJobTitleChange={setJobTitle}
              onLocationChange={setLocation}
              onMinScoreChange={setMinScore}
            />

            <JobsTable jobs={jobs} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}