import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        'serif-en': ['var(--font-playfair)', 'serif'],
        'serif-ja': [
          'var(--font-zen-old-mincho)',
          'Hiragino Mincho ProN',
          'BIZ UDPMincho',
          'MS Mincho',
          'serif',
        ],
        'sans-en': ['var(--font-inter)', 'sans-serif'],
        'sans-ja': [
          'var(--font-noto-sans-jp)',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Yu Gothic',
          'Meiryo',
          'sans-serif',
        ],
        'sans-zh': [
          'var(--font-noto-sans-sc)',
          '"PingFang SC"',
          '"Source Han Sans SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        'serif-zh': ['var(--font-noto-serif-sc)', '"Source Han Serif SC"', '"Songti SC"', 'serif'],
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
