/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF5',
          100: '#FAF5E9',
          200: '#F3EAD3',
        },
        forest: {
          50: '#EFF6F1',
          100: '#DCEBE1',
          200: '#B9D5C4',
          300: '#8CB8A0',
          400: '#5E967B',
          500: '#3E7A5F',
          600: '#2C6249',
          700: '#234E3B',
          800: '#1C3D2F',
          900: '#12281E',
        },
        ember: {
          50: '#FDF3EC',
          100: '#FAE3D2',
          200: '#F4C5A3',
          300: '#EDA071',
          400: '#E67C42',
          500: '#E06324',
          600: '#C74E17',
          700: '#A53D12',
        },
        clay: {
          100: '#F1EBE4',
          200: '#E0D5C7',
          300: '#C9B7A1',
          500: '#9A8163',
          700: '#5E4F3B',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(28, 61, 47, 0.08)',
        lift: '0 6px 20px rgba(28, 61, 47, 0.14)',
      },
    },
  },
  plugins: [],
};
