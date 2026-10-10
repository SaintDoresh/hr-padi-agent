'use client';

import { AlertTriangle, Briefcase, Check, Copy, Download, GraduationCap, Layers, Mail, MapPin, MessageSquareQuote, Phone, Timer, Wrench, Zap } from 'lucide-react';
import { useState } from 'react';
import type { CandidateProfile as Profile } from '@/lib/schema';
import { Panel, Pill, QuietButton, ScoreRing, StatCard, fitBand, initials } from './ui';

export interface Parsed {
  id: string;
  fileName: string;
  role: string;
  profile: Profile;
  totalMs: number;
  model: string;
}

function Contact({ icon: Icon, value, href }: { icon: typeof Mail; value: string; href?: string }) {
  if (value === '') return null;
  const body = (
    <>
      <Icon size={15} className="shrink-0 text-ink-faint" aria-hidden />
      <span className="truncate">{value}</span>
    </>
  );
  const cls = 'inline-flex max-w-full items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-base text-ink';
  return href ? (
    <a href={href} className={`${cls} hover:border-accent-line hover:text-accent`}>
      {body}
    </a>
  ) : (
    <span className={cls}>{body}</span>
  );
}

export function CandidateProfile({ parsed }: { parsed: Parsed }) {
  const { profile: p } = parsed;
  const band = fitBand(p.fit_score);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(p, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard refused; the download still works */
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.full_name.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'candidate'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Identity and score */}
      <section className="rounded-panel bg-surface-raised p-5 sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-pill bg-accent-soft text-xl font-semibold text-accent" aria-hidden>
              {initials(p.full_name)}
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{p.full_name}</h2>
              {p.headline && <p className="mt-0.5 text-md text-ink-muted">{p.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Contact icon={Mail} value={p.email} href={p.email ? `mailto:${p.email}` : undefined} />
                <Contact icon={Phone} value={p.phone} href={p.phone ? `tel:${p.phone.replace(/[^\d+]/g, '')}` : undefined} />
                <Contact icon={MapPin} value={p.location} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 md:flex-col md:items-end lg:flex-row lg:items-center">
            <ScoreRing score={p.fit_score} />
            <div className="space-y-2 md:text-right lg:text-left">
              <Pill tone={band.tone} dot>
                {band.label}
              </Pill>
              <p className="max-w-[14rem] text-sm text-ink-muted">{parsed.role ? `Scored against: ${parsed.role}` : 'Scored against their own headline'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Figures */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Parsed in" value={`${(parsed.totalMs / 1000).toFixed(1)}s`} icon={Zap}>
          PDF to profile
        </StatCard>
        <StatCard label="Experience" value={`${p.years_of_experience} yrs`} icon={Timer} />
        <StatCard label="Core skills" value={p.skills.length} icon={Wrench} />
        <StatCard label="Roles held" value={p.work_experience.length} icon={Layers} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel title="Work history" icon={Briefcase} aside={`${p.work_experience.length} ${p.work_experience.length === 1 ? 'role' : 'roles'}`}>
            {p.work_experience.length === 0 ? (
              <p className="text-base text-ink-muted">No work history found in this resume.</p>
            ) : (
              <ol className="relative space-y-6 border-l border-border pl-6">
                {p.work_experience.map((job, index) => (
                  <li key={`${job.company}-${index}`} className="relative">
                    <span className={`absolute -left-[31px] top-1 size-3.5 rounded-pill ring-4 ring-surface-raised ${index === 0 ? 'bg-accent' : 'bg-border'}`} aria-hidden />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold text-ink">{job.role || 'Role not stated'}</h3>
                      {job.duration && <span className="num text-sm text-ink-muted">{job.duration}</span>}
                    </div>
                    <div className="text-base font-medium text-accent">{job.company}</div>
                    {job.key_achievement && (
                      <p className="mt-2 rounded-control bg-accent-soft/60 px-3 py-2 text-base text-ink">
                        <span className="font-semibold text-accent">Key achievement · </span>
                        {job.key_achievement}
                      </p>
                    )}
                    {job.bullet_points.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {job.bullet_points.map((point) => (
                          <li key={point} className="flex gap-2 text-base text-ink-muted">
                            <span className="mt-2 size-1 shrink-0 rounded-pill bg-ink-faint" aria-hidden />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Education" icon={GraduationCap}>
            {p.education.length === 0 ? (
              <p className="text-base text-ink-muted">No education listed.</p>
            ) : (
              <ul className="divide-y divide-border">
                {p.education.map((school, index) => (
                  <li key={`${school.institution}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-ink">{school.qualification || 'Qualification not stated'}</div>
                      <div className="text-base text-ink-muted">{school.institution}</div>
                    </div>
                    {school.year && <span className="num text-sm text-ink-muted">{school.year}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Recruiter verdict" icon={MessageSquareQuote}>
            <p className="text-md leading-relaxed text-ink">{p.summary_verdict || 'No verdict returned.'}</p>
            {p.strengths.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Strengths</div>
                <ul className="space-y-1.5">
                  {p.strengths.map((s) => (
                    <li key={s} className="flex gap-2 text-base text-ink">
                      <Check size={16} className="mt-0.5 shrink-0 text-good" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.concerns.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Worth asking about</div>
                <ul className="space-y-1.5">
                  {p.concerns.map((s) => (
                    <li key={s} className="flex gap-2 text-base text-ink">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Core skills" icon={Wrench} aside={p.skills.length}>
            {p.skills.length === 0 ? (
              <p className="text-base text-ink-muted">No skills found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.skills.map((skill, index) => (
                  <span
                    key={skill}
                    className={`rounded-pill px-3 py-1.5 text-base font-medium ${index < 5 ? 'bg-accent-soft text-accent' : 'bg-surface text-ink'}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Structured output">
            <p className="text-base text-ink-muted">The validated JSON, ready for the Prolanz BOS candidate record.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <QuietButton onClick={copy}>
                {copied ? <Check size={16} className="text-good" aria-hidden /> : <Copy size={16} aria-hidden />}
                {copied ? 'Copied' : 'Copy JSON'}
              </QuietButton>
              <QuietButton onClick={download}>
                <Download size={16} aria-hidden /> Download
              </QuietButton>
            </div>
            <details className="group mt-4">
              <summary className="cursor-pointer text-base font-medium text-accent">Show JSON</summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-control bg-surface-sunken p-3 text-sm text-ink">{json}</pre>
            </details>
          </Panel>
        </div>
      </div>

      <p className="text-sm text-ink-faint">
        {parsed.fileName} · parsed in <span className="num">{(parsed.totalMs / 1000).toFixed(2)}s</span> · {parsed.model} via Groq
      </p>
    </div>
  );
}
