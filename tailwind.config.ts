import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151413",
        porcelain: "#faf9f6",
        paper: "#ffffff",
        silk: "#ede8dc",
        rosewood: "#6f2e2b",
        olive: "#56624a",
        brass: "#b59a63"
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 20, 19, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
