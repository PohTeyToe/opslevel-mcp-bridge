import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d5d5db",
          400: "#8a8a96",
          600: "#494953",
          800: "#22222a",
          900: "#0e0e13",
        },
        accent: {
          DEFAULT: "#ff5b1f",
          soft: "#ffe6dc",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
