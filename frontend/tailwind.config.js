/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // App surfaces
        canvas: "#F6F7F9", // page background
        surface: "#FFFFFF", // cards / panels
        line: "#E7E9EE", // hairline borders

        // Text
        ink: {
          DEFAULT: "#0F172A",
          soft: "#334155",
          muted: "#64748B",
          faint: "#94A3B8",
        },

        // Brand — indigo. Used with restraint: primary actions, active nav, focus.
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },

        // The dark "control-tower" navigation rail.
        rail: {
          bg: "#0B1220",
          panel: "#111A2C",
          hover: "#18233A",
          border: "#1F2A44",
          text: "#E5E9F2",
          muted: "#93A1BA",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.05), 0 1px 3px 0 rgba(16,24,40,0.04)",
        "card-hover": "0 4px 12px -2px rgba(16,24,40,0.10), 0 2px 6px -2px rgba(16,24,40,0.06)",
        dropdown: "0 12px 32px -12px rgba(16,24,40,0.28)",
        rail: "1px 0 0 0 rgba(255,255,255,0.04)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 0.2s ease-out both",
        "scale-in": "scale-in 0.12s ease-out both",
      },
    },
  },
  plugins: [],
};
