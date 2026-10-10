'use client';

import { ScanText, ShieldCheck, Users, Menu, X, type LucideIcon } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { cx } from './ui';

export type View = 'parse' | 'candidates';

function Lockup() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[11px] bg-accent text-md font-bold tracking-tight text-accent-ink" aria-hidden>
        HP
      </span>
      <span className="text-xl font-semibold tracking-snug text-ink">HR Padi</span>
    </div>
  );
}

const ITEMS: readonly { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'parse', label: 'Resume parser', icon: ScanText },
  { view: 'candidates', label: 'Candidates', icon: Users },
];

function Nav({ view, count, onGo }: { view: View; count: number; onGo: (view: View) => void }) {
  return (
    <nav aria-label="HR Padi">
      <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Recruit</div>
      <ul className="space-y-1">
        {ITEMS.map(({ view: target, label, icon: Icon }) => {
          const current = target === view;
          return (
            <li key={target}>
              <button
                type="button"
                onClick={() => onGo(target)}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-md transition-colors',
                  current ? 'bg-surface-raised font-semibold text-accent' : 'font-medium text-ink hover:bg-surface-raised/60',
                )}
              >
                <Icon size={20} strokeWidth={1.7} className={current ? 'text-accent' : 'text-ink-faint'} aria-hidden />
                <span className="flex-1 text-left">{label}</span>
                {target === 'candidates' && count > 0 && (
                  <span className="num grid min-w-6 place-items-center rounded-pill bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-ink">{count}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Foot() {
  return (
    <div className="rounded-card bg-surface-raised p-4">
      <div className="flex items-center gap-2 text-base font-semibold text-ink">
        <ShieldCheck size={18} className="text-accent" aria-hidden /> Session only
      </div>
      <p className="mt-1 text-sm text-ink-muted">Resumes are read in your browser and sent only to the parsing model. Close the tab and they are gone.</p>
    </div>
  );
}

export function Shell({ view, count, onGo, children }: { view: View; count: number; onGo: (view: View) => void; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    if (!drawer) return;
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [drawer]);
  const go = (next: View) => {
    setDrawer(false);
    onGo(next);
  };

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <div className="shrink-0 bg-ink px-4 py-2 text-center text-sm text-surface">
        Built for the <span className="font-semibold">Prolanz BOS</span> platform · parsing by Groq
      </div>

      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setDrawer(true)} aria-label="Open the menu" aria-expanded={drawer} className="grid size-10 place-items-center rounded-pill text-ink hover:bg-surface-raised">
          <Menu size={22} aria-hidden />
        </button>
        <Lockup />
        <span className="size-10" aria-hidden />
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-scrim/40" aria-label="Close the menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-surface p-4 shadow-float">
            <div className="mb-6 flex items-center justify-between px-2 pt-1">
              <Lockup />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close the menu" className="grid size-9 place-items-center rounded-pill text-ink-muted hover:bg-surface-raised hover:text-ink">
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Nav view={view} count={count} onGo={go} />
            </div>
            <Foot />
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1">
        <aside className="hidden w-72 shrink-0 flex-col px-5 pb-5 pt-8 lg:flex">
          <div className="mb-10 shrink-0 px-3">
            <Lockup />
            <div className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">for recruiters</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Nav view={view} count={count} onGo={go} />
          </div>
          <Foot />
        </aside>
        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
