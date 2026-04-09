"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FiltersPanel from "@/components/dashboard/FiltersPanel";
import JobsTable from "@/components/dashboard/JobsTable";
import ResumePanel from "@/components/dashboard/ResumePanel";
import ResumePreviewCard from "@/components/dashboard/ResumePreviewCard";
import StatusMessage from "@/components/dashboard/StatusMessage";
import type { Job, ResumePreview } from "@/types/jobs";

type ScoreResponse = {
  jobs: Job[];
  explanation: string;
};

type TabKey = "build" | "matches" | "sync";

const API_BASE_URL = "";

const sideNavLinkBase =
  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[0.85rem] font-semibold text-[#667184] transition-colors";
const sideNavLinkActive =
  "bg-white text-[#20306e] shadow-[0_10px_20px_rgba(32,48,110,0.06)]";
const cardBase = "rounded-[20px] bg-surface-container-lowest p-8 shadow-card";
const footerPrimary =
  "inline-flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-base font-bold text-white shadow-[0_18px_35px_rgba(0,6,102,0.25)] transition hover:bg-primary-container";
const footerSecondary =
  "inline-flex items-center gap-2 text-on-surface-variant font-bold transition hover:text-on-surface";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("build");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scoredJobs, setScoredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [minScore, setMinScore] = useState(50);
  const [resultLimit, setResultLimit] = useState(15);
  const hasAutoScraped = useRef(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [scoreStatus, setScoreStatus] = useState<string | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);

  const stepNumber = activeTab === "sync" ? 3 : activeTab === "matches" ? 2 : 1;
  const stepProgress = stepNumber / 3;

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
      const limitedDefaults = withDefaultScores.slice(0, resultLimit);
      if (resumeFile && hasScored && scoredJobs.length > 0) {
        setJobs(scoredJobs.filter((job) => job.match_score >= minScore));
      } else {
        setJobs(limitedDefaults);
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
      setPreviewStatus("Resume parsed. Preview is ready when you open it.");
      setShowPreview(false);
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
      setActiveTab("matches");
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
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-white/80 px-8 shadow-[0_8px_24px_rgba(15,17,21,0.06)] backdrop-blur-[16px]">
        <div className="font-display text-[1.1rem] font-extrabold italic tracking-[-0.02em] text-[#1b2a6b]">
          The Career Architect
        </div>
        <div className="hidden items-center gap-8 text-[0.95rem] max-[768px]:hidden md:flex">
          <span className="font-medium text-[#657086] transition-colors hover:text-[#2a3ed1]">
            Explore
          </span>
          <span className="font-medium text-[#657086] transition-colors hover:text-[#2a3ed1]">
            Resources
          </span>
          <button className="rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-2 text-[0.85rem] font-bold text-on-primary transition-transform hover:-translate-y-0.5">
            Apply Now
          </button>
        </div>
      </nav>

      <aside className="fixed left-0 top-16 flex h-[calc(100vh-64px)] w-64 flex-col gap-4 bg-[#f4f6f9] px-4 py-6 max-[1200px]:static max-[1200px]:h-auto max-[1200px]:w-full max-[1200px]:flex-row max-[1200px]:items-center max-[1200px]:justify-between max-[1200px]:px-6 max-[1200px]:py-4 max-[768px]:hidden">
        <div className="px-4 pb-4">
          <div className="font-display text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#20306e]">
            Architect Workspace
          </div>
          <div className="text-[0.7rem] text-[#8b93a8]">AI-Powered Career Hub</div>
        </div>
        <div className="flex flex-1 flex-col gap-1 max-[1200px]:flex-row max-[1200px]:flex-wrap">
          <button
            type="button"
            className={`${sideNavLinkBase} ${
              activeTab === "build" ? sideNavLinkActive : "hover:bg-[#e7ecf3] hover:text-[#20306e]"
            }`}
            onClick={() => setActiveTab("build")}
          >
            <span className="material-symbols-outlined">edit_note</span>
            Build
          </button>
          <button
            type="button"
            className={`${sideNavLinkBase} ${
              activeTab === "matches" ? sideNavLinkActive : "hover:bg-[#e7ecf3] hover:text-[#20306e]"
            }`}
            onClick={() => setActiveTab("matches")}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Matches
          </button>
          <button
            type="button"
            className={`${sideNavLinkBase} ${
              activeTab === "sync" ? sideNavLinkActive : "hover:bg-[#e7ecf3] hover:text-[#20306e]"
            }`}
            onClick={() => setActiveTab("sync")}
          >
            <span className="material-symbols-outlined">sync_alt</span>
            Sync
          </button>
          <button
            type="button"
            className={`${sideNavLinkBase} hover:bg-[#e7ecf3] hover:text-[#20306e]`}
          >
            <span className="material-symbols-outlined">person</span>
            Profile
          </button>
        </div>
        <div className="flex flex-col gap-1 border-t border-transparent pt-4 max-[1200px]:flex-row max-[1200px]:flex-wrap">
          <button className="rounded-[14px] bg-secondary-container px-4 py-3 text-[0.85rem] font-bold text-on-secondary-container">
            Upgrade to Pro
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[0.85rem] font-semibold text-[#667184] transition-colors hover:bg-[#e7ecf3]"
          >
            <span className="material-symbols-outlined">help</span>
            Help
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[0.85rem] font-semibold text-[#667184] transition-colors hover:bg-[#e7ecf3]"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-0 w-full max-w-[1100px] px-6 pb-8 pt-20 max-[1200px]:ml-0 md:px-12 md:pb-12 md:pt-24 xl:ml-64">
        <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between max-[768px]:items-start">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-on-primary-fixed">
              Onboarding Experience
            </div>
            <h1 className="mb-4 text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.1] text-on-surface">
              Craft your professional blueprint.
            </h1>
            <p className="max-w-[34rem] text-[1.05rem] text-on-surface-variant">
              Let&apos;s begin by cataloging your expertise. Your resume acts as the
              foundational structure for our AI matching engine.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-[0.85rem] font-semibold text-on-surface-variant md:items-end">
            <span>Step {stepNumber} of 3</span>
            <div className="h-2 w-[200px] overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full w-full origin-left bg-gradient-to-r from-tertiary-fixed-dim to-on-tertiary-container shadow-[0_0_12px_rgba(0,170,161,0.3)] transition-transform duration-300"
                style={{ transform: `scaleX(${stepProgress})` }}
              />
            </div>
          </div>
        </header>

        {activeTab === "build" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] max-[1200px]:grid-cols-1">
            <section className="flex flex-col gap-8">
              <ResumePanel
                resumeFile={resumeFile}
                resultLimit={resultLimit}
                onResumeChange={setResumeFile}
                onResultLimitChange={setResultLimit}
                onPreview={parseResume}
                onScore={scoreJobs}
              />

              {previewStatus && <StatusMessage text={previewStatus} />}

              {resumePreview && (
                <div className={`${cardBase} flex items-center justify-between gap-6`}>
                  <div>
                    <p className="mb-2 text-[1.05rem] font-bold">Resume Preview</p>
                    <p className="max-w-[34rem] text-[1.05rem] text-on-surface-variant">
                      Open the snapshot to review the extracted content and skills.
                    </p>
                  </div>
                  <button
                    className={footerSecondary}
                    type="button"
                    onClick={() => setShowPreview((prev) => !prev)}
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>
              )}

              {resumePreview && showPreview && (
                <ResumePreviewCard
                  resumePreview={resumePreview}
                  onClose={() => {
                    setResumePreview(null);
                    setPreviewStatus(null);
                    setShowPreview(false);
                  }}
                />
              )}
            </section>

            <aside className="flex flex-col gap-8">
              <div className={`${cardBase} border border-[rgba(118,118,131,0.1)]`}>
                <h3 className="mb-6 flex items-center gap-2 text-[1.05rem] font-bold">
                  <span className="material-symbols-outlined text-tertiary">local_offer</span>
                  Expertise &amp; Interests
                </h3>
                <p className="mb-6 text-[0.9rem] text-on-surface-variant">
                  Tags help our matching engine prioritize the right internship
                  opportunities for you.
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-1.5 text-[0.8rem] font-semibold text-on-secondary-container">
                    UI/UX Design <span className="material-symbols-outlined">close</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-1.5 text-[0.8rem] font-semibold text-on-secondary-container">
                    React <span className="material-symbols-outlined">close</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-1.5 text-[0.8rem] font-semibold text-on-secondary-container">
                    Figma <span className="material-symbols-outlined">close</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-1.5 text-[0.8rem] font-semibold text-on-secondary-container">
                    Strategy <span className="material-symbols-outlined">close</span>
                  </div>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b93a8]">
                    add
                  </span>
                  <input
                    type="text"
                    placeholder="Add a skill..."
                    className="w-full rounded-2xl border-none bg-surface-container-high py-3 pl-10 pr-4 text-[0.85rem] focus:outline-none"
                  />
                </div>
                <div className="mt-6 border-t border-surface-container pt-6">
                  <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9aa2b2]">
                    Suggested for you
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-xl border border-outline-variant px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant">
                      + TypeScript
                    </button>
                    <button className="rounded-xl border border-outline-variant px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant">
                      + Python
                    </button>
                    <button className="rounded-xl border border-outline-variant px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant">
                      + Product Management
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-surface-container-low p-8 shadow-card">
                <h3 className="mb-6 flex items-center gap-2 text-[1.05rem] font-bold">
                  <span className="material-symbols-outlined text-tertiary">psychology</span>
                  Career Interests
                </h3>
                <label className="mb-3 block text-[0.85rem] font-semibold text-on-surface-variant">
                  What is your ideal career trajectory?
                </label>
                <textarea
                  className="min-h-[120px] w-full resize-y rounded-2xl border-none bg-surface-container-high p-4 text-[0.95rem] text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the roles, industries, and impact you want to have in your next position..."
                />
              </div>

              <div className="group rounded-[20px] bg-primary p-8 text-on-primary shadow-card">
                <h3 className="mb-2 text-[1.2rem] font-bold">Curator Insights</h3>
                <p className="mb-6 max-w-[22rem] text-[0.9rem] text-[#bdc2ff]">
                  Users who upload a detailed resume see a 40% increase in high-quality
                  matches during their first week.
                </p>
                <img
                  className="h-[140px] w-full rounded-[14px] object-cover opacity-40 grayscale transition duration-[400ms] group-hover:opacity-60 group-hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTTv-3iEb3vBgFMDXgdabvdOeJX2UP0wlGmT-ipv1WzahnCgiw6-fP7KyJRSFcrYYNrICm-JpjD1_Cdx9Ot3frFXL0lHm1rrKxurdqdCZm6Ic2sNmofo9crtch_TqdGVkjOa5Zd0H8Enhyog1dmwACOPLyX4UE1Xl3zO2NxZ56Tp5HAVO0u_C63093vWljvV6VaSEBK5vBz08e3ff3q86MHEpxKPTsYrmmIWiEcltw3tk54c9Grwt7mEkN6-U-CDF45yqP3zkfB38"
                  alt="modern office environment with soft focus desk setup and warm cinematic lighting showing professional focus"
                />
                <div className="absolute bottom-[-20px] right-[-20px] h-[130px] w-[130px] rounded-full bg-white/10 blur-[24px]" />
              </div>
            </aside>
          </div>
        ) : activeTab === "matches" ? (
          <section className="flex flex-col gap-8">
            <div className={`${cardBase} flex flex-col gap-4`}>
              <h3 className="flex items-center gap-2 text-[1.05rem] font-bold">
                <span className="material-symbols-outlined text-tertiary">track_changes</span>
                Match Summary
              </h3>
              <p className="text-[1.05rem] text-on-surface-variant">
                {jobs.length} listings live · threshold at {minScore}% · top {resultLimit}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button className={footerPrimary} onClick={runScrape}>
                  Refresh Listings
                </button>
                <button
                  className={footerSecondary}
                  type="button"
                  onClick={() => setActiveTab("build")}
                >
                  Edit Resume Signals
                </button>
              </div>
            </div>

            <FiltersPanel
              jobTitle={jobTitle}
              location={location}
              minScore={minScore}
              onJobTitleChange={setJobTitle}
              onLocationChange={setLocation}
              onMinScoreChange={setMinScore}
            />

            {scoreStatus && <StatusMessage text={scoreStatus} />}
            {!hasScored && (
              <StatusMessage text="Upload a resume to compute match scores. Scores default to 0 until then." />
            )}
            {hasScored && scoreExplanation && (
              <StatusMessage text={scoreExplanation} />
            )}
            {scrapeStatus && <StatusMessage text={scrapeStatus} />}

            <JobsTable jobs={jobs} loading={loading} />
          </section>
        ) : (
          <section className="flex flex-col gap-8">
            <div className={`${cardBase} flex flex-col gap-4`}>
              <h3 className="flex items-center gap-2 text-[1.05rem] font-bold">
                <span className="material-symbols-outlined text-tertiary">sync_alt</span>
                Sync Progress
              </h3>
              <p className="text-[1.05rem] text-on-surface-variant">
                Connect your workflow to keep internships, resume updates, and
                outreach status in one place.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className={footerPrimary}
                  type="button"
                  onClick={() => setActiveTab("matches")}
                >
                  Back to Matches
                </button>
                <button
                  className={footerSecondary}
                  type="button"
                  onClick={() => setActiveTab("build")}
                >
                  Edit Resume Signals
                </button>
              </div>
            </div>
            <div className="rounded-[20px] bg-surface-container-low p-8 shadow-card">
              <h3 className="mb-6 flex items-center gap-2 text-[1.05rem] font-bold">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                Next Steps
              </h3>
              <p className="text-[1.05rem] text-on-surface-variant">
                We&apos;ll add calendar, CRM, and notification sync in this step. For
                now, use it as a checkpoint before export.
              </p>
            </div>
          </section>
        )}

        <footer className="mt-12 flex items-center justify-between border-t border-surface-container pt-8">
          <button className={footerSecondary} type="button">
            <span className="material-symbols-outlined">arrow_back</span>
            Previous Step
          </button>
          <button
            className={footerPrimary}
            type="button"
            onClick={() => setActiveTab("sync")}
          >
            Continue to Sync
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </footer>
      </main>

      <div className="hidden max-[768px]:block">
        <button
          className="fixed bottom-8 right-8 grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary shadow-[0_12px_24px_rgba(0,6,102,0.25)]"
          type="button"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}