// tailwind.config.js
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html",
    ],
    theme: {
        extend: {
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
