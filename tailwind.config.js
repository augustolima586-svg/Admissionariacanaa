// tailwind.config.js
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--primary)',
                    hover: 'var(--primary-hover)',
                    dark: 'var(--primary-dark)',
                    shadow: 'var(--primary-shadow)',
                    light: 'var(--primary-light)',
                    text: 'var(--primary-text)',
                    glow: 'var(--primary-glow)',
                }
            },
            borderRadius: {
                lg: "12px",
            },
            minHeight: {
                touch: "44px",
            },
            boxShadow: {
                soft: "0 4px 12px rgba(0,0,0,0.05)",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
