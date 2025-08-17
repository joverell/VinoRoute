// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // We are extending the default color palette
      colors: {
        // Here we define our custom 'coral' color
        coral: {
          500: '#FF5757', // This is the vibrant coral from our design
          600: '#E04A4A', // A slightly darker version for the hover state
        },
      },
    },
  },
  plugins: [],
};
export default config;
