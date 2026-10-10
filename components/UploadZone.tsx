'use client';

import { FileText, Sparkles, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { LIMITS } from '@/lib/schema';
import { cx } from './ui';

export function UploadZone({ disabled, onFile, onSample }: { disabled: boolean; onFile: (file: File) => void; onSample: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (!disabled && file) onFile(file);
      }}
      className={cx(
        'flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14',
        over ? 'border-accent bg-accent-soft' : 'border-border bg-surface-sunken',
        disabled && 'opacity-60',
      )}
    >
      <div className={cx('mb-4 grid size-14 place-items-center rounded-pill', over ? 'bg-accent text-accent-ink' : 'bg-surface-raised text-accent')}>
        <UploadCloud size={26} strokeWidth={1.8} aria-hidden />
      </div>
      <p className="text-lg font-semibold text-ink">{over ? 'Drop to parse' : 'Drag a resume PDF here'}</p>
      <p className="mt-1 text-base text-ink-muted">PDF only, up to {LIMITS.pdfBytes / 1024 / 1024} MB. Read in your browser — nothing is stored.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="inline-flex h-12 items-center gap-2 rounded-pill bg-accent px-5 text-md font-semibold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileText size={18} aria-hidden /> Choose a PDF
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSample}
          className="inline-flex h-12 items-center gap-2 rounded-pill border border-border bg-surface-raised px-5 text-md font-semibold text-ink transition-colors hover:border-accent-line hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles size={18} aria-hidden /> Load Sample Candidate
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
