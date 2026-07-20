/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ported 1:1 from the legacy :root custom properties in 0711檔案.html
        abyss: '#eef3f3',
        panel: '#ffffff',
        'panel-raised': '#f3f7f7',
        line: '#dbe4e5',
        ink: '#132228',
        'ink-dim': '#667c83',
        teal: '#1c7f8c',
        'teal-dim': '#bfdde1',
        signal: '#ff6a3d',
        'signal-dim': '#ffe1d3',
        ok: '#2f9e63',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
