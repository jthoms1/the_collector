/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Retro Comic Book Palette
        cream: '#FFF8E7',
        paper: '#FFF8E7',
        teal: {
          DEFAULT: '#4A7C6F',
          light: '#5A8C7F',
          dark: '#3A6C5F',
        },
        rust: {
          DEFAULT: '#C75146',
          light: '#D76156',
          dark: '#B74136',
        },
        brown: {
          DEFAULT: '#5C4033',
          light: '#6C5043',
          dark: '#4C3023',
        },
        gold: {
          DEFAULT: '#D4A84B',
          light: '#E4B85B',
          dark: '#C4983B',
        },
        navy: {
          DEFAULT: '#2E4057',
          light: '#3E5067',
          dark: '#1E3047',
        },
        peach: {
          DEFAULT: '#F5DEB3',
          light: '#FFF0D0',
          dark: '#E5CEA3',
        },
        // Keep primary/accent as aliases for backwards compatibility
        primary: {
          50: '#FFF8E7',
          100: '#FFF0D0',
          200: '#F5DEB3',
          300: '#E5CEA3',
          400: '#D4A84B',
          500: '#4A7C6F',
          600: '#4A7C6F',
          700: '#3A6C5F',
          800: '#2E4057',
          900: '#1E3047',
        },
        accent: {
          50: '#FEE9E7',
          100: '#FDDDD9',
          200: '#F5B5AF',
          300: '#E08078',
          400: '#D76156',
          500: '#C75146',
          600: '#B74136',
          700: '#973626',
          800: '#772B1E',
          900: '#572016',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'comic': '4px 4px 0 0 #5C4033',
        'comic-sm': '2px 2px 0 0 #5C4033',
        'comic-lg': '6px 6px 0 0 #5C4033',
        'comic-teal': '4px 4px 0 0 #4A7C6F',
        'comic-teal-lg': '6px 6px 0 0 #4A7C6F',
      },
      borderRadius: {
        'panel': '0.5rem',
      },
    },
  },
  plugins: [],
};
