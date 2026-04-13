/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        void: "#0a0a0f",
        panel: "#12121a",
        "panel-elevated": "#1a1a24",
        "panel-hover": "#22222e",

        // Accents
        cyan: {
          DEFAULT: "#00d4ff",
          dim: "#00a8cc",
          glow: "rgba(0, 212, 255, 0.3)",
        },
        amber: {
          DEFAULT: "#ff9900",
          dim: "#cc7a00",
          glow: "rgba(255, 153, 0, 0.3)",
        },

        // Status
        success: "#10b981",
        failed: "#ef4444",
        pending: "#f59e0b",
        running: "#00d4ff",

        // Text
        "text-primary": "#f0f0f5",
        "text-secondary": "#a0a0b0",
        "text-tertiary": "#606070",

        // Borders
        border: "rgba(255, 255, 255, 0.1)",
        "border-accent": "rgba(0, 212, 255, 0.3)",

        // Legacy HSL support
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontFamily: {
        display: ["JetBrains Mono", "monospace"],
        body: ["IBM Plex Sans", "sans-serif"],
        code: ["Fira Code", "monospace"],
      },
      borderRadius: {
        lg: "4px",
        md: "2px",
        sm: "2px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-amber": "0 0 20px rgba(255, 153, 0, 0.3)",
        deep: "0 4px 6px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 212, 255, 0.05)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        progress: "progress 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)" },
        },
        progress: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 0%" },
        },
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
