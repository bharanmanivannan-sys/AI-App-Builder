/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0D14",
        surface: "#121824",
        "surface-2": "#1A2133",
        surfaceHover: "#1E2638",
        line: "#1E293B",
        brand: "#3B82F6",
        accent: "#60A5FA",
        violet: "#8B5CF6",
        cyan: "#06B6D4",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#0EA5E9",
        tprimary: "#F8FAFC",
        tsecondary: "#94A3B8",
        tmuted: "#64748B",
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(59,130,246,0.45)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
