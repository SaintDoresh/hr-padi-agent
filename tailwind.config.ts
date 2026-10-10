import type { Config } from 'tailwindcss';

/**
 * Colours are CSS variables (app/globals.css), so the whole interface re-hues
 * from one place. Components never write a raw hex value.
 */
const v = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: v('surface'), raised: v('surface-raised'), sunken: v('surface-sunken') },
        border: v('border'),
        ink: { DEFAULT: v('ink'), muted: v('ink-muted'), faint: v('ink-faint') },
        accent: { DEFAULT: v('accent'), ink: v('accent-ink'), soft: v('accent-soft'), line: v('accent-line') },
        warn: { DEFAULT: v('warn'), ink: v('warn-ink'), soft: v('warn-soft') },
        good: { DEFAULT: v('good'), soft: v('good-soft') },
        scrim: v('scrim'),
      },
      borderRadius: { card: '20px', panel: '24px', control: '12px', pill: '999px' },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '22px'],
        lg: ['15px', '22px'],
        xl: ['17px', '24px'],
        '2xl': ['22px', '28px'],
      },
      letterSpacing: { tight: '-0.02em', snug: '-0.01em', wide: '0.08em' },
      boxShadow: { float: '0 6px 20px hsl(var(--shadow) / 0.14)' },
      fontFamily: { sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
