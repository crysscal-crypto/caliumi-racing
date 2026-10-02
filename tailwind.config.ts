import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#0a0a0a",
          900: "#121212",
          800: "#1a1a1a",
          700: "#232323",
        },
        racing: {
          yellow: "#F5D300",
          red: "#E10600",
        },
      },
      backgroundImage: {
        "carbon-texture": "url('/textures/carbon-fiber.jpg')",
      },
    },
  },
  plugins: [],
};
export default config;
