import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                luxyra: {
                    plum: "#1A0B16", // Midnight base
                    deep: "#2E1025", // Lighter plum
                    gold: "#D4AF37", // Elegant gold
                    blush: "#F2C1D1", // Soft blush
                    champagne: "#F7E7CE",
                    void: "#0d050a", // Darker background
                },
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "sans-serif"],
                serif: ["var(--font-geist-mono)", "serif"], // Using mono variable as placeholder or standard serif
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'midnight-glow': 'radial-gradient(circle at center, #2E1025 0%, #1A0B16 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
