import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Kept for backwards compatibility with existing usages.
        brand: {
          navy: '#1B4F72',
          cobalt: '#2E86C1',
          success: '#27AE60',
          warn: '#F39C12',
          danger: '#E74C3C',
        },
        // Semantic tokens (Phase 1). Prefer these in new/refactored components.
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
          sunken: 'var(--color-surface-sunken)',
        },
        ink: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        line: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          fg: 'var(--color-primary-fg)',
          soft: 'var(--color-primary-soft)',
        },
        link: {
          DEFAULT: 'var(--color-link)',
          hover: 'var(--color-link-hover)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          soft: 'var(--color-success-soft)',
          ink: 'var(--color-success-ink)',
          line: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          soft: 'var(--color-warning-soft)',
          ink: 'var(--color-warning-ink)',
          line: 'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          soft: 'var(--color-danger-soft)',
          ink: 'var(--color-danger-ink)',
          line: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
          ink: 'var(--color-info-ink)',
          line: 'var(--color-info-border)',
        },
        focusring: 'var(--color-focus)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      // New keys only (no override of Tailwind defaults, so existing pages are untouched).
      borderRadius: {
        card: '12px',
        control: '8px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 43, 0.06)',
        raised: '0 1px 2px rgba(20, 33, 43, 0.05), 0 4px 12px rgba(20, 33, 43, 0.06)',
        float: '0 8px 28px rgba(20, 33, 43, 0.10)',
      },
      maxWidth: {
        content: '1200px',
        prose: '760px',
        form: '640px',
      },
      zIndex: {
        sticky: '30',
        dropdown: '40',
        overlay: '45',
        drawer: '50',
        modal: '60',
        toast: '70',
      },
    },
  },
  plugins: [],
}
export default config
