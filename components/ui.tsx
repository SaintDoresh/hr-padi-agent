/**
 * Page furniture, after the Urcrib vendor portal's look: roomy white panels on
 * a soft page, hairlines instead of shadows, pill-shaped actions, and one red
 * action per screen.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function PageHeader({ eyebrow, title, lead, action }: { eyebrow?: string; title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</div>}
          <h1 className="page-title min-w-0 text-ink">{title}</h1>
        </div>
        {action && <div className="flex max-w-full flex-wrap items-center gap-2">{action}</div>}
      </div>
      {lead && <p className="mt-2 max-w-2xl text-md text-ink-muted">{lead}</p>}
    </div>
  );
}

export function Panel({ title, icon: Icon, aside, children, className }: { title?: ReactNode; icon?: LucideIcon; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-panel bg-surface-raised p-5 sm:p-6', className)}>
      {title !== undefined && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border pb-4">
          <h2 className="flex min-w-0 items-center gap-2.5 text-xl font-semibold tracking-snug text-ink">
            {Icon && <Icon size={20} strokeWidth={1.8} className="shrink-0 text-accent" aria-hidden />}
            {title}
          </h2>
          {aside !== undefined && <div className="min-w-0 text-base text-ink-muted">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, children }: { label: string; value: ReactNode; icon: LucideIcon; children?: ReactNode }) {
  return (
    <div className="rounded-panel bg-surface-raised p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base text-ink-muted">{label}</div>
          <div className="stat-figure mt-2 text-ink">{value}</div>
        </div>
        <Icon size={24} strokeWidth={1.5} className="shrink-0 text-ink-faint" aria-hidden />
      </div>
      {children !== undefined && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-muted">{children}</div>}
    </div>
  );
}

export type Tone = 'neutral' | 'red' | 'amber' | 'green' | 'quiet';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface text-ink',
  red: 'bg-accent-soft text-accent',
  amber: 'bg-warn-soft text-warn-ink',
  green: 'bg-good-soft text-good',
  quiet: 'bg-transparent text-ink-muted',
};

export function Pill({ tone = 'neutral', dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-1 text-sm font-medium', TONES[tone])}>
      {dot && <span className="size-2 rounded-pill bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function PrimaryButton({ children, onClick, disabled = false, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-accent px-5 text-md font-semibold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function QuietButton({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-pill border border-border bg-surface-raised px-4 text-base font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** How a fit score reads, in one place. */
export function fitBand(score: number): { label: string; tone: Tone } {
  if (score >= 85) return { label: 'Strong match', tone: 'green' };
  if (score >= 70) return { label: 'Good match', tone: 'red' };
  if (score >= 50) return { label: 'Partial match', tone: 'amber' };
  return { label: 'Weak match', tone: 'neutral' };
}

export function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Fit score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-accent-soft" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="stroke-accent transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num text-[28px] font-semibold leading-none tracking-tight text-ink">{score}</div>
          <div className="mt-1 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Fit / 100</div>
        </div>
      </div>
    </div>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}
