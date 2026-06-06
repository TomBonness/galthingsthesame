/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        swiss: {
          bg: '#f4f4f0',       // Warm Swiss off-white
          text: '#111111',     // High-contrast near-black
          red: '#D81E05',      // Swiss Red
          gray: '#888888',     // Muted gray for secondary borders/text
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}