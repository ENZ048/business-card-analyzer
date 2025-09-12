/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Premium color scheme
        'premium-white': '#FFFFFF',
        'premium-beige': '#EFEAE3',
        'premium-beige-light': '#F5F2ED',
        'premium-beige-dark': '#E5DDD3',
        'premium-black': '#000000',
        'premium-orange': '#FE330A',
        'premium-orange-light': '#FF5A33',
        'premium-orange-dark': '#E02A08',
        'premium-orange-muted': '#FFE5E1',
        'premium-gray': '#6B7280',
        'premium-gray-light': '#9CA3AF',
        'premium-gray-dark': '#374151',
        'premium-border': '#D1D5DB',
        'premium-border-light': '#E5E7EB',
        'premium-border-dark': '#9CA3AF',
        
        // CSS variables for compatibility
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-border': 'var(--card-border)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        'input-border': 'var(--input-border)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
