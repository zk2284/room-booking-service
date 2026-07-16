/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5fd",
          100: "#e2eafb",
          200: "#c1d3f5",
          300: "#8fb0ec",
          400: "#5686df",
          500: "#3566d1",
          600: "#254bb5",
          700: "#1f3d92",
          800: "#1e3578",
          900: "#1c2f63",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
