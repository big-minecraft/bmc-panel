/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                'primary': 'var(--color-primary)',
                'primary-hover': 'var(--color-primaryHover)',
                'primary-light': 'var(--color-primaryLight)',
                'secondary': 'var(--color-secondary)',
                'secondary-hover': 'var(--color-secondaryHover)',
                'secondary-light': 'var(--color-secondaryLight)',
                'background': 'var(--color-background)',
                'background-offset': 'var(--color-backgroundOffset)',
                'text': 'var(--color-text)',
                'text-secondary': 'var(--color-textSecondary)',
                'text-disabled': 'var(--color-textDisabled)',
                'border': 'var(--color-border)',
                'border-hover': 'var(--color-borderHover)',
                'error': 'var(--color-error)',
                'error-dark': 'var(--color-errorDark)',
                'warning': 'var(--color-warning)',
                'info': 'var(--color-info)',
                'success': 'var(--color-success)',
            },
        },
    },
    plugins: [],
};