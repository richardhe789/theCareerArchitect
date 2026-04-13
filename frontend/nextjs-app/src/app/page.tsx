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

type TabKey = "build" | "matches" | "help";

const AVAILABLE_SKILLS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "SQL",
  "PostgreSQL",
  "Node.js",
  "Next.js",
  "FastAPI",
  "AWS",
  "Docker",
  "Kubernetes",
  "Machine Learning",
  "Data Analysis",
  "UI/UX Design",
  "Figma",
  "Product Management",
  "Testing",
  "Git",
  "REST APIs",
  "Tailwind CSS",
  "System Design",
] as const;

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
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "UI/UX Design",
    "React",
    "Figma",
  ]);
  const [skillSearch, setSkillSearch] = useState("");

  const stepNumber = activeTab === "matches" ? 2 : 1;
  const stepProgress = stepNumber / 2;
  const showProgress = activeTab !== "help";

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (jobTitle) params.append("job_title", jobTitle);
    if (location) params.append("location", location);
    return params.toString();
  }, [jobTitle, location]);

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    return AVAILABLE_SKILLS.filter((skill) => {
      const matchesQuery = !query || skill.toLowerCase().includes(query);
      return matchesQuery && !selectedSkills.includes(skill);
    });
  }, [skillSearch, selectedSkills]);

  const addSkill = (skill: string) => {
    setSelectedSkills((current) =>
      current.includes(skill) ? current : [...current, skill]
    );
    setSkillSearch("");
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((current) => current.filter((item) => item !== skill));
  };

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

    setPreviewStatus(null);
    setPreviewProgress(5);
    const progressTimer = window.setInterval(() => {
      setPreviewProgress((current) => {
        if (current === null) return 5;
        return Math.min(current + 7, 92);
      });
    }, 450);
    const formData = new FormData();
    formData.append("file", activeFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });
      const data: ResumePreview = await response.json();
      setResumePreview(data);
      setPreviewProgress(100);
      window.setTimeout(() => {
        setPreviewProgress(null);
        setPreviewStatus("Resume parsed. Preview is ready when you open it.");
      }, 500);
      setShowPreview(false);
      await scoreJobs(activeFile);
    } catch (error) {
      console.error("Failed to parse resume", error);
      setPreviewStatus("Failed to parse resume. Check backend logs.");
      setPreviewProgress(null);
    }

    window.clearInterval(progressTimer);
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
    selectedSkills.forEach((skill) => formData.append("selected_skills", skill));

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
        <div />
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
        </div>
        <div className="flex flex-col gap-1 border-t border-transparent pt-4 max-[1200px]:flex-row max-[1200px]:flex-wrap">
          <button
            type="button"
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[0.85rem] font-semibold transition-colors ${
              activeTab === "help"
                ? "bg-[#e7ecf3] text-[#20306e]"
                : "text-[#667184] hover:bg-[#e7ecf3]"
            }`}
            onClick={() => setActiveTab("help")}
          >
            <span className="material-symbols-outlined">help</span>
            Help
          </button>
        </div>
      </aside>

      <main className="ml-0 w-full max-w-none px-6 pb-8 pt-20 max-[1200px]:ml-0 md:px-10 md:pb-12 md:pt-24 xl:ml-64 xl:pr-10">
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
          {showProgress && (
            <div className="flex flex-col items-start gap-2 text-[0.85rem] font-semibold text-on-surface-variant md:items-end">
              <span>Step {stepNumber} of 2</span>
              <div className="h-2 w-[200px] overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full w-full origin-left bg-gradient-to-r from-tertiary-fixed-dim to-on-tertiary-container shadow-[0_0_12px_rgba(0,170,161,0.3)] transition-transform duration-300"
                  style={{ transform: `scaleX(${stepProgress})` }}
                />
              </div>
            </div>
          )}
        </header>

        {activeTab === "build" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] max-[1200px]:grid-cols-1">
            <section className="flex flex-col gap-8">
              <ResumePanel
                resumeFile={resumeFile}
                resultLimit={resultLimit}
                onResumeChange={setResumeFile}
                onResultLimitChange={setResultLimit}
                onPreview={parseResume}
                onScore={scoreJobs}
              />

              {previewProgress !== null ? (
                <div className="rounded-[16px] bg-surface-container-lowest p-4 shadow-card">
                  <div className="mb-2 flex items-center justify-between text-[0.85rem] font-semibold text-on-surface-variant">
                    <span>Parsing resume</span>
                    <span>{previewProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full bg-gradient-to-r from-tertiary-fixed-dim to-on-tertiary-container transition-[width] duration-300"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                previewStatus && <StatusMessage text={previewStatus} />
              )}

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
                  {selectedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-1.5 text-[0.8rem] font-semibold text-on-secondary-container"
                    >
                      {skill}
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b93a8]">
                    add
                  </span>
                  <input
                    type="text"
                    placeholder="Search skills to add..."
                    className="w-full rounded-2xl border-none bg-surface-container-high py-3 pl-10 pr-4 text-[0.85rem] focus:outline-none"
                    value={skillSearch}
                    onChange={(event) => setSkillSearch(event.target.value)}
                  />
                </div>
                <div className="mt-6 border-t border-surface-container pt-6">
                  <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#9aa2b2]">
                    Available skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="rounded-xl border border-outline-variant px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant"
                        >
                          + {skill}
                        </button>
                      ))
                    ) : (
                      <p className="text-[0.8rem] text-on-surface-variant">
                        No more matching skills to add.
                      </p>
                    )}
                  </div>
                </div>
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
        ) : activeTab === "help" ? (
          <section className="flex flex-col gap-8">
            <div className={`${cardBase} flex flex-col gap-4`}>
              <h3 className="flex items-center gap-2 text-[1.2rem] font-bold">
                <span className="material-symbols-outlined text-tertiary">help</span>
                How the Career Architect Works
              </h3>
              <p className="text-[1.05rem] text-on-surface-variant">
                This workspace helps you turn a resume into focused internship matches.
                Upload your resume, tune your filters, and review the best Simplify listings
                in one place.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Build",
                  description:
                    "Upload a resume, review the AI preview, and define the signals you want to emphasize.",
                  icon: "edit_note",
                },
                {
                  step: "2",
                  title: "Matches",
                  description:
                    "Scrape listings, score them against your resume, and refine the shortlist with filters.",
                  icon: "auto_awesome",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[20px] bg-surface-container-lowest p-6 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#9aa2b2]">
                      Step {item.step}
                    </div>
                    <span className="material-symbols-outlined text-tertiary">
                      {item.icon}
                    </span>
                  </div>
                  <h4 className="mt-4 text-[1.1rem] font-bold text-on-surface">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-[0.95rem] text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[20px] bg-primary p-8 text-on-primary shadow-card">
              <h3 className="mb-4 text-[1.2rem] font-bold">Quick Walkthrough</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {["Upload Resume", "Tune Filters", "Score Listings"].map(
                  (label, index) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-[0.95rem] font-bold">
                        {index + 1}
                      </div>
                      <div className="text-[0.95rem] font-semibold">{label}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="mt-12 flex items-center justify-between border-t border-surface-container pt-8">
          {activeTab === "matches" ? (
            <button className={footerSecondary} type="button" onClick={() => setActiveTab("build")}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Resume
            </button>
          ) : (
            <div />
          )}
          {activeTab === "build" ? (
            <button
              className={footerPrimary}
              type="button"
              onClick={() => setActiveTab("matches")}
            >
              View Matches
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <div />
          )}
        </footer>
      </main>

    </div>
  );
}