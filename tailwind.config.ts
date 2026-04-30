import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#141719",
        steel: "#58636d",
        nickel: "#d6dce0",
        signal: "#d94f2b",
        cobalt: "#1f5f8b"
      },
      fontFamily: {
        sans: ["Inter", "Pretendard", "Arial", "sans-serif"]
      },
      boxShadow: {
        industrial: "0 20px 55px rgba(20, 23, 25, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
