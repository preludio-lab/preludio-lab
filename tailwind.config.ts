import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
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
            },
        },
    },
    plugins: [],
};
export default config;
