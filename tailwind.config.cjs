/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Cascadia Mono"', 'Consolas', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
