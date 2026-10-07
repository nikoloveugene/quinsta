import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        quinsta: {
          primary: "#2f6b3a",
          "primary-content": "#f4faf5",
          secondary: "#3d5a40",
          "secondary-content": "#f4faf5",
          accent: "#c4782a",
          "accent-content": "#1a1208",
          neutral: "#2a332b",
          "neutral-content": "#eef2ee",
          "base-100": "#f6f4ef",
          "base-200": "#ebe7de",
          "base-300": "#d9d3c6",
          "base-content": "#1c241d",
          info: "#3a6f8c",
          success: "#2f6b3a",
          warning: "#b8860b",
          error: "#a33b2c",
        },
      },
    ],
  },
};

export default config;
