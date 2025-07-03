/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#e8f4f8',
          100: '#d1e9f1',
          200: '#a3d3e3',
          300: '#75bdd5',
          400: '#47a7c7',
          500: '#1991b9', // Derived from #143454
          600: '#143454', // Main primary
          700: '#0f2940',
          800: '#0a1e2c',
          900: '#051318',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: '#e9ecef',
          100: '#d3d9df',
          200: '#a7b3bf',
          300: '#7b8d9f',
          400: '#4f677f',
          500: '#17293b', // Second color
          600: '#14243a',
          700: '#111f31',
          800: '#0e1a28',
          900: '#0b151f',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: '#f2f2f3',
          100: '#e5e6e7',
          200: '#cbcdcf',
          300: '#b1b4b7',
          400: '#979b9f',
          500: '#3d4347', // Third color
          600: '#31363a',
          700: '#25292c',
          800: '#191c1f',
          900: '#0d0f11',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neutral: {
          50: '#f7f7f6',
          100: '#efeeec',
          200: '#dfddd9',
          300: '#cfccc6',
          400: '#bfbbb3',
          500: '#5f5c50', // Fourth color
          600: '#4c4940',
          700: '#393730',
          800: '#262520',
          900: '#131210',
        },
        sage: {
          50: '#f4f6f3',
          100: '#e9ece7',
          200: '#d3d9cf',
          300: '#bdc6b7',
          400: '#a7b39f',
          500: '#6e7866', // Fifth color
          600: '#586052',
          700: '#42483d',
          800: '#2c3029',
          900: '#161814',
        },
        // Semantic colors adapted for dark theme
        success: {
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}