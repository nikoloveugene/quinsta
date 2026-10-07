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
        "quinsta-dark": {
          primary: "#5d9a66",
          "primary-content": "#0c140e",
          secondary: "#8fa894",
          "secondary-content": "#0c140e",
          accent: "#d4923f",
          "accent-content": "#1a1208",
          neutral: "#1a221c",
          "neutral-content": "#dce4dd",
          "base-100": "#121814",
          "base-200": "#1a221c",
          "base-300": "#2a342c",
          "base-content": "#e6eee7",
          info: "#6a9db8",
          success: "#5d9a66",
          warning: "#d4a017",
          error: "#d46a5c",
        },
      },
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
