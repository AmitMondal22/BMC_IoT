/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
          dark: 'var(--color-brand-dark)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
          dim: 'var(--color-surface-dim)',
          input: 'var(--color-surface-input)',
          sidebar: 'var(--color-surface-sidebar)',
          card: 'var(--color-surface-card)',
        },
        t: {
          primary: 'var(--color-t-primary)',
          secondary: 'var(--color-t-secondary)',
          muted: 'var(--color-t-muted)',
        },
        edge: {
          DEFAULT: 'var(--color-edge)',
          subtle: 'var(--color-edge-subtle)',
        }
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        glow: 'var(--shadow-glow)',
        button: 'var(--shadow-button)',
      }
    },
  },
  plugins: [],
}
