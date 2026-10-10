'use client';

import { AlertCircle, ArrowLeft, FileSearch, Loader2, RotateCcw, Target, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { extractPdfText } from '@/lib/pdf';
import { SAMPLE_FILE_NAME, SAMPLE_RESUME, SAMPLE_ROLE } from '@/lib/sample';
import { LIMITS, type ParseResponse } from '@/lib/schema';
import { CandidateProfile, type Parsed } from './CandidateProfile';
import { UploadZone } from './UploadZone';
import { Shell, type View } from './Shell';
import { PageHeader, Panel, Pill, PrimaryButton, QuietButton, cx, fitBand, initials } from './ui';

type Stage = { kind: 'idle' } | { kind: 'reading'; fileName: string } | { kind: 'parsing'; fileName: string } | { kind: 'error'; message: string };

const STEPS = ['Reading the PDF', 'Extracting with HR Padi', 'Scoring the fit'] as const;

function Progress({ stage }: { stage: Extract<Stage, { kind: 'reading' | 'parsing' }> }) {
  const at = stage.kind === 'reading' ? 0 : 1;
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <Loader2 size={22} className="animate-spin text-accent" aria-hidden />
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-ink">{stage.fileName}</div>
          <div className="text-base text-ink-muted" aria-live="polite">
            {STEPS[at]}…
          </div>
        </div>
      </div>
      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className={cx(
              'rounded-control px-3 py-2 text-sm font-medium',
              index < at ? 'bg-good-soft text-good' : index === at || (at === 1 && index === 2) ? 'bg-accent-soft text-accent' : 'bg-surface text-ink-faint',
            )}
          >
            {index + 1}. {step}
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-3" aria-hidden>
        <div className="skeleton h-20 rounded-card" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-24 rounded-card" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-card" />
      </div>
    </Panel>
  );
}

function CandidateList({ items, onOpen }: { items: Parsed[]; onOpen: (id: string) => void }) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.profile.fit_score - a.profile.fit_score), [items]);
  if (sorted.length === 0) {
    return (
      <div className="rounded-card border border-border px-6 py-12 text-center text-base text-ink-muted">
        No candidates yet. Parse a resume and they appear here, ranked by fit.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border">
      {sorted.map((item, rank) => {
        const band = fitBand(item.profile.fit_score);
        return (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)} className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface sm:px-5">
              <span className="num w-5 shrink-0 text-sm font-semibold text-ink-faint">{rank + 1}</span>
              <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-accent-soft text-sm font-semibold text-accent" aria-hidden>
                {initials(item.profile.full_name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold text-ink">{item.profile.full_name}</span>
                <span className="block truncate text-base text-ink-muted">
                  {item.profile.headline || '—'} · {item.profile.years_of_experience} yrs
                </span>
              </span>
              <span className="hidden sm:block">
                <Pill tone={band.tone}>{band.label}</Pill>
              </span>
              <span className="num w-12 shrink-0 text-right text-2xl font-semibold tracking-tight text-ink">{item.profile.fit_score}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Workspace() {
  const [view, setView] = useState<View>('parse');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [candidates, setCandidates] = useState<Parsed[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const busy = stage.kind === 'reading' || stage.kind === 'parsing';
  const open = candidates.find((c) => c.id === openId) ?? null;

  async function parse(fileName: string, getText: () => Promise<string>, targetRole: string) {
    const started = performance.now();
    setOpenId(null);
    setView('parse');
    try {
      setStage({ kind: 'reading', fileName });
      const text = await getText();
      if (text.trim().length < LIMITS.minResumeChars) {
        throw new Error('This PDF has almost no selectable text — it is probably a scan. Try a text-based PDF.');
      }
      setStage({ kind: 'parsing', fileName });
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role: targetRole }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ParseResponse> & { error?: string };
      if (!res.ok || !data.profile) throw new Error(data.error ?? `Parsing failed (${res.status}).`);
      const entry: Parsed = {
        id: crypto.randomUUID(),
        fileName,
        role: targetRole.trim(),
        profile: data.profile,
        model: data.model ?? 'Groq',
        totalMs: performance.now() - started,
      };
      setCandidates((all) => [entry, ...all]);
      setOpenId(entry.id);
      setStage({ kind: 'idle' });
    } catch (error) {
      setStage({ kind: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' });
    }
  }

  function onFile(file: File) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return setStage({ kind: 'error', message: `“${file.name}” is not a PDF.` });
    if (file.size > LIMITS.pdfBytes) return setStage({ kind: 'error', message: `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.` });
    void parse(file.name, async () => (await extractPdfText(file)).text, role);
  }

  function onSample() {
    if (role.trim() === '') setRole(SAMPLE_ROLE);
    void parse(SAMPLE_FILE_NAME, async () => SAMPLE_RESUME, role.trim() === '' ? SAMPLE_ROLE : role);
  }

  const go = (next: View) => {
    setView(next);
    if (next === 'parse' && !busy) setOpenId(null);
  };

  return (
    <Shell view={view} count={candidates.length} onGo={go}>
      {view === 'candidates' && open === null ? (
        <>
          <PageHeader
            eyebrow="This session"
            title="Candidates"
            lead="Everyone you have parsed, ranked by fit score. Nothing is saved — this list clears when you close the tab."
            action={
              <PrimaryButton onClick={() => go('parse')}>
                <FileSearch size={18} aria-hidden /> Parse a resume
              </PrimaryButton>
            }
          />
          <Panel title="Ranked by fit" icon={Users} aside={`${candidates.length} parsed`}>
            <CandidateList items={candidates} onOpen={(id) => setOpenId(id)} />
          </Panel>
        </>
      ) : open !== null ? (
        <>
          <PageHeader
            eyebrow={open.fileName}
            title="Candidate profile"
            action={
              <>
                <QuietButton onClick={() => (setOpenId(null), setView('candidates'))}>
                  <ArrowLeft size={16} aria-hidden /> All candidates
                </QuietButton>
                <PrimaryButton onClick={() => (setOpenId(null), setView('parse'))}>
                  <RotateCcw size={18} aria-hidden /> Parse another
                </PrimaryButton>
              </>
            }
          />
          <CandidateProfile parsed={open} />
        </>
      ) : (
        <>
          <PageHeader
            eyebrow="Resume parser"
            title="Turn a resume into a candidate profile"
            lead="Drop in an applicant's PDF. HR Padi pulls out contact details, skills, work history and education, then scores the fit and tells you why — in about three seconds."
          />
          <div className="space-y-5">
            <Panel title="Hiring for" icon={Target} aside="Optional">
              <label htmlFor="role" className="sr-only">
                Role you are hiring for
              </label>
              <textarea
                id="role"
                value={role}
                disabled={busy}
                maxLength={LIMITS.roleChars}
                onChange={(event) => setRole(event.target.value)}
                rows={2}
                placeholder="e.g. Senior Frontend Engineer — React, TypeScript; 5+ years; fintech a plus"
                className="w-full resize-none rounded-control border border-border bg-surface px-4 py-3 text-md text-ink outline-none placeholder:text-ink-faint focus:border-accent-line focus:bg-surface-raised"
              />
              <p className="mt-2 text-sm text-ink-muted">The fit score is measured against this. Leave it empty to score against the candidate&apos;s own headline.</p>
            </Panel>

            {busy ? (
              <Progress stage={stage} />
            ) : (
              <Panel>
                {stage.kind === 'error' && (
                  <div role="alert" className="mb-5 flex items-start gap-3 rounded-control bg-accent-soft px-4 py-3 text-base text-ink">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <span className="min-w-0 flex-1">{stage.message}</span>
                    <button type="button" onClick={() => setStage({ kind: 'idle' })} className="shrink-0 text-sm font-semibold text-accent hover:underline">
                      Dismiss
                    </button>
                  </div>
                )}
                <UploadZone disabled={busy} onFile={onFile} onSample={onSample} />
              </Panel>
            )}

            {candidates.length > 0 && !busy && (
              <Panel title="Recently parsed" icon={Users} aside={<button type="button" onClick={() => setView('candidates')} className="font-semibold text-accent hover:underline">See all</button>}>
                <CandidateList items={candidates.slice(0, 3)} onOpen={(id) => setOpenId(id)} />
              </Panel>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
