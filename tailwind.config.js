/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#050810",
          soft: "#0b1220",
          line: "#19243a",
        },
        paper: {
          DEFAULT: "#e8effc",
        },
        accent: {
          DEFAULT: "#00f0ff",
        },
        purple: {
          DEFAULT: "#b026ff",
        },
        verdict: {
          match: "#10b981",
          uncertain: "#f59e0b",
          reject: "#ef4444",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
