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
        // High-Tech Navy Blue + Electric Cyan Theme
        background: "#0F172A",
        sidebar: "#020617",
        surface: "#1E293B",
        surfaceLight: "#334155",
        border: "#334155",
        primary: {
          DEFAULT: "#0EA5E9",
          light: "#38BDF8",
          dark: "#0284C7",
        },
        secondary: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
        // Electric Cyan Accent - High Tech
        cyan: {
          DEFAULT: "#06B6D4",
          light: "#22D3EE",
          dark: "#0891B2",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        // Electric Blue
        electric: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        // Neon accents
        neon: {
          cyan: "#00FFFF",
          blue: "#0080FF",
          purple: "#BF00FF",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: "#64748B",
        text: {
          DEFAULT: "#F1F5F9",
          muted: "#94A3B8",
          light: "#CBD5E1",
          inverse: "#0F172A",
        },
        accent: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 0 0 1px rgba(6, 182, 212, 0.1), 0 4px 20px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 0 0 1px rgba(6, 182, 212, 0.2), 0 8px 30px rgba(6, 182, 212, 0.15)",
        "elevated": "0 0 0 1px rgba(6, 182, 212, 0.15), 0 12px 40px rgba(0, 0, 0, 0.5)",
        "sidebar": "4px 0 30px rgba(0, 0, 0, 0.5)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)",
        "header": "0 4px 30px rgba(0, 0, 0, 0.4)",
        "neon": "0 0 5px #06B6D4, 0 0 10px #06B6D4, 0 0 20px #06B6D4",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
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
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" },
          "50%": { boxShadow: "0 0 30px rgba(6, 182, 212, 0.6)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-tech': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F172A 0%, #020617 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
