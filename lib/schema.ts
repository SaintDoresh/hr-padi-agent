/**
 * The candidate profile HR Padi returns. Whatever the model sends back is
 * passed through `normalizeProfile`, so the UI always receives exactly this
 * shape — a missing field becomes an empty value, never a crash.
 */

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  key_achievement: string;
  bullet_points: string[];
}

export interface Education {
  institution: string;
  qualification: string;
  year: string;
}

export interface CandidateProfile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  years_of_experience: number;
  skills: string[];
  work_experience: WorkExperience[];
  education: Education[];
  fit_score: number;
  summary_verdict: string;
  strengths: string[];
  concerns: string[];
}

export interface ParseResponse {
  profile: CandidateProfile;
  model: string;
  llm_ms: number;
}

const MAX_SKILLS = 30;
const MAX_JOBS = 12;
const MAX_BULLETS = 6;

function str(value: unknown, max = 400): string {
  if (typeof value === 'string') return value.trim().slice(0, max);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function num(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : Number.NaN;
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function list<T>(value: unknown, map: (item: unknown) => T | null, limit: number): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const mapped = map(item);
    if (mapped !== null) out.push(mapped);
    if (out.length >= limit) break;
  }
  return out;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function uniqueStrings(value: unknown, limit: number, max = 80): string[] {
  const seen = new Set<string>();
  return list(
    value,
    (item) => {
      const s = str(item, max);
      const key = s.toLowerCase();
      if (s === '' || seen.has(key)) return null;
      seen.add(key);
      return s;
    },
    limit,
  );
}

/** "ADAEZE OKAFOR" → "Adaeze Okafor". Mixed-case names are left as written. */
function nameCase(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * Models sometimes "correct" an unusual name — a company called "Translated"
 * comes back as "Translating". When a name is not in the resume verbatim, snap
 * it to the phrase in the resume it was plainly taken from: same number of
 * words, and each word sharing all but its last few letters. Otherwise keep it.
 */
export function groundName(name: string, source: string): string {
  if (name === '' || source.toLowerCase().includes(name.toLowerCase())) return name;
  const want = name.split(/\s+/);
  const words = source.match(/[\p{L}\p{N}&.'-]+/gu) ?? [];
  const stem = (a: string, b: string) => {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    let shared = 0;
    while (shared < x.length && shared < y.length && x[shared] === y[shared]) shared += 1;
    return shared >= 4 && shared >= Math.max(x.length, y.length) - 3;
  };
  for (let i = 0; i + want.length <= words.length; i += 1) {
    const window = words.slice(i, i + want.length);
    if (window.every((word, k) => stem(word, want[k] ?? ''))) return window.join(' ');
  }
  return name;
}

/** [end, start] years from "Mar 2022 – Present", "2021", "2019-2020"; Present counts as the far future. */
function span(duration: string): [number, number] {
  const years = (duration.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
  const current = /present|current|now|date/i.test(duration);
  const start = years[0] ?? 0;
  const end = current ? 9999 : (years[years.length - 1] ?? start);
  return [end, start];
}

/** Most recent first, by the dates as written; roles without dates keep their place at the end. */
function byRecency(jobs: WorkExperience[]): WorkExperience[] {
  return jobs
    .map((job, index) => ({ job, index, at: span(job.duration) }))
    .sort((a, b) => b.at[0] - a.at[0] || b.at[1] - a.at[1] || a.index - b.index)
    .map(({ job }) => job);
}

export function normalizeProfile(raw: unknown, source = ''): CandidateProfile {
  const r = record(raw);
  return {
    full_name: nameCase(str(r.full_name, 120)) || 'Unnamed candidate',
    email: str(r.email, 160),
    phone: str(r.phone, 60),
    location: str(r.location, 120),
    headline: str(r.headline, 160),
    years_of_experience: Math.round(num(r.years_of_experience, 0, 60) * 10) / 10,
    skills: uniqueStrings(r.skills, MAX_SKILLS),
    work_experience: byRecency(list(
      r.work_experience,
      (item) => {
        const job = record(item);
        const company = groundName(str(job.company, 120), source);
        const role = str(job.role, 120);
        if (company === '' && role === '') return null;
        return {
          company,
          role,
          duration: str(job.duration, 80),
          key_achievement: str(job.key_achievement, 400),
          bullet_points: uniqueStrings(job.bullet_points, MAX_BULLETS, 300),
        };
      },
      MAX_JOBS,
    )),
    education: list(
      r.education,
      (item) => {
        const school = record(item);
        const institution = groundName(str(school.institution, 160), source);
        const qualification = str(school.qualification, 160);
        if (institution === '' && qualification === '') return null;
        return { institution, qualification, year: str(school.year, 40) };
      },
      6,
    ),
    fit_score: Math.round(num(r.fit_score, 0, 100)),
    summary_verdict: str(r.summary_verdict, 800),
    strengths: uniqueStrings(r.strengths, 4, 200),
    concerns: uniqueStrings(r.concerns, 4, 200),
  };
}

/** Limits shared by the browser and the API route. */
export const LIMITS = {
  pdfBytes: 5 * 1024 * 1024,
  resumeChars: 24_000,
  minResumeChars: 80,
  roleChars: 600,
} as const;
