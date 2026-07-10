/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-golos)", "sans-serif"],
      },
      colors: {
        ink: "#26251e",
        muted: "#6b6960",
        bar: "#c9cfd2",
        median: "#8a877c",
        border: "#d8d6d0",
      },
    },
  },
  plugins: [],
};
