import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // White + Sky Blue Premium Theme
        background: "#F8FAFC",
        sidebar: "#FFFFFF",
        surface: "#FFFFFF",
        surfaceLight: "#F0F9FF",
        border: "#E0F2FE",
        primary: {
          DEFAULT: "#0284C7",
          light: "#38BDF8",
          dark: "#0369A1",
        },
        secondary: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
        // Sky Blue palette
        sky: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: "#64748B",
        text: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
          light: "#94A3B8",
          inverse: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#0284C7",
          hover: "#0369A1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(2,132,199,0.06)",
        "card-hover": "0 4px 20px rgba(2,132,199,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        "elevated": "0 8px 32px rgba(2,132,199,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        "sidebar": "2px 0 16px rgba(2,132,199,0.08)",
        "header": "0 2px 16px rgba(2,132,199,0.08)",
        "inner": "inset 0 1px 3px rgba(2,132,199,0.06)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "gentle-pulse": "gentle-pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "gentle-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-sky': 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
        'gradient-sky-soft': 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
        'gradient-white': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
