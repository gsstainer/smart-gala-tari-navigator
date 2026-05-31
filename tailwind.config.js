/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(222, 47%, 6%)",
        glass: "hsla(223, 40%, 12%, 0.65)",
        "glass-heavy": "hsla(223, 40%, 8%, 0.85)",
        primary: "hsl(210, 100%, 60%)",
        secondary: "hsl(280, 100%, 65%)",
        success: "hsl(145, 80%, 50%)",
        warning: "hsl(38, 95%, 55%)",
        danger: "hsl(355, 90%, 55%)",
        "text-pure": "hsl(0, 0%, 100%)",
        "text-high": "hsl(210, 15%, 90%)",
        "text-mid": "hsl(210, 10%, 70%)",
        "text-muted": "hsl(210, 10%, 50%)",
      },
      fontFamily: {
        heading: ["Outfit", "Noto Sans KR", "sans-serif"],
        body: ["Outfit", "Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
}
