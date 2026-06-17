import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lani: {
          green: "#087443",
          emerald: "#10a768",
          blue: "#0b66c3",
          navy: "#0f2442",
          gold: "#c9972b",
          coral: "#d95845",
          ink: "#182233",
          mist: "#eef6f2",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 36, 66, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
