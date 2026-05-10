import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        sand: '#F7F3EC',
        ink: '#1F1A17',
        teal: '#0F766E',
        mint: '#D1FAE5',
        clay: '#A16207'
      },
      boxShadow: {
        soft: '0 24px 70px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;

