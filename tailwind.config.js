/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: channel('bg'),
        surface: channel('surface'),
        ink: channel('ink'),
        muted: channel('muted'),
        line: channel('line'),
        accent: channel('accent'),
        'accent-2': channel('accent-2'),
        'on-accent': channel('on-accent'),
        coral: channel('coral'),
        sun: channel('sun'),
        pink: channel('pink'),
      },
      fontFamily: {
        display: ['ui-rounded', '"Arial Rounded MT Bold"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
