export type Job = {
  id?: number;
  company: string;
  role: string;
  location: string;
  url: string;
  date_posted: string;
  match_score: number;
};

export type ResumePreview = {
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