import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",
        ink: "#17201A",
        muted: "#5E6A63",
        line: "#E2E8E3",
        primary: "#0B6B4E",
        amber: "#F5A524",
        coral: "#E75A4F",
        sky: "#3B82F6"
      },
      borderRadius: {
        panel: "8px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 26, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
