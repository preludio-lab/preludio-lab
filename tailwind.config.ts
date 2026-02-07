import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        'serif-en': ['var(--font-playfair)', 'serif'],
        'serif-ja': ['var(--font-zen-old-mincho)', 'serif'],
        'sans-en': ['var(--font-inter)', 'sans-serif'],
        'sans-ja': ['var(--font-noto-sans-jp)', 'sans-serif'],
        'sans-zh': ['var(--font-noto-sans-sc)', 'sans-serif'],
        'serif-zh': ['var(--font-noto-serif-sc)', 'serif'],
      },
      colors: {
        'classic-gold': '#C5A059',
        'preludio-black': '#1A1A1A',
        'paper-white': '#F9F9F7',
        // Admin UI Colors (Figma v2) - CSS Variables参照
        'admin-primary': 'var(--admin-primary)',
        'admin-primary-light': 'var(--admin-primary-light)',
        'admin-success': 'var(--admin-success)',
        'admin-danger': 'var(--admin-danger)',
        'admin-warning': 'var(--admin-warning)',
        'admin-sidebar-bg': 'var(--admin-sidebar-bg)',
        'admin-content-bg': 'var(--admin-content-bg)',
        'admin-card-bg': 'var(--admin-card-bg)',
        'admin-text-primary': 'var(--admin-text-primary)',
        'admin-text-secondary': 'var(--admin-text-secondary)',
        'admin-border': 'var(--admin-border)',
      },
      spacing: {
        'admin-sidebar': 'var(--admin-sidebar-width)',
        'admin-header': 'var(--admin-header-height)',
      },
    },
  },
  plugins: [],
};
export default config;
