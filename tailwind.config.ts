import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pl: {
          purple:       '#37003c',
          'purple-dark':'#2d0030',
          'purple-mid': '#4a0060',
          'purple-light':'#6b0086',
          green:        '#00ff87',
          'green-dim':  '#00cc6e',
          'green-dark': '#009950',
        },
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0,255,135,0.35)',
        'glow-green-lg': '0 0 40px rgba(0,255,135,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
