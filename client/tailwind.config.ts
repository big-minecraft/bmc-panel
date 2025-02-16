import type { Config } from 'tailwindcss'

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        undetermined: '#ff0000',
        background: {
          DEFAULT: '#ffffff',
          offset: '#f3f4f6',
          dark: '#111827',
          'offset-dark': '#1f2937'
        },
        primary: {
          'first': '#111827',
          'first-dark': '#f3f4f6',
          'second': '#4b5563',
          'second-dark': '#d1d5db',
          'third': '#9ca3af',
          'third-dark': '#6b7280'
        },
        accent: {
          'text': '#4f46e5',
          'text-dark': '#a5b4fc',
          'text-hover': '#6366f1',
          'text-hover-dark': '#c7d2fe',
          'bg': '#e0e7ff',
          'bg-dark': '#3730a3',
          'bg-hover': '#c7d2fe',
          'bg-hover-dark': '#4338ca'
        },
        'negative-accent': {
          'text': '#ffffff',
          'text-dark': '#111827',
          'text-hover': '#ffffff',
          'text-hover-dark': '#111827',
          'bg': '#4f46e5',
          'bg-dark': '#a5b4fc',
          'bg-hover': '#4338ca',
          'bg-hover-dark': '#c7d2fe'
        },
        success: {
          'text': '#166534',
          'text-dark': '#86efac',
          'text-hover': '#166534',
          'text-hover-dark': '#bbf7d0',
          'bg': '#166534',
          'bg-dark': '#14532d',
          'bg-hover': '#166534',
          'bg-hover-dark': '#166534'
        },
        warning: {
          'text': '#ca8a04',
          'text-dark': '#fde047',
          'text-hover': '#ca8a04',
          'text-hover-dark': '#fef08a',
          'bg': '#854d0e',
          'bg-dark': '#713f12',
          'bg-hover': '#854d0e',
          'bg-hover-dark': '#854d0e'
        },
        danger: {
          'text': '#991b1b',
          'text-dark': '#fca5a5',
          'text-hover': '#991b1b',
          'text-hover-dark': '#fecaca',
          'bg': '#991b1b',
          'bg-dark': '#7f1d1d',
          'bg-hover': '#991b1b',
          'bg-hover-dark': '#991b1b'
        },
        info: {
          'text': '#2563eb',
          'text-dark': '#93c5fd',
          'text-hover': '#2563eb',
          'text-hover-dark': '#bfdbfe',
          'bg': '#1e40af',
          'bg-dark': '#1e3a8a',
          'bg-hover': '#1e40af',
          'bg-hover-dark': '#1e40af'
        }
      }
    }
  },
  plugins: [],
} as const

export default config;