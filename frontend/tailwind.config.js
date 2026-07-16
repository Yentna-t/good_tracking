/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aict: { green: "#1F8A5B", dark: "#176b46", soft: "#E8F5EE", background: "#F4F7F5", ink: "#17211B", muted: "#6B7B71", border: "#DFE7E2" },
      },
      boxShadow: { card: "0 10px 32px rgba(28, 54, 32, .06)" },
    },
  },
  plugins: [],
};
