/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./BitEdit/**/*.html", // Scans index.html and any other HTML in BitEdit/
    "./BitEdit/**/*.js",   // Scans sw.js and script tags in index.html for classes
  ],
  theme: {
    extend: {
      // You can extend the default Tailwind theme here if needed
      // For example, to use your CSS variables with Tailwind:
      colors: {
        'custom-canvas': 'var(--bg-canvas)',
        'custom-primary': 'var(--bg-primary)',
        'custom-secondary': 'var(--bg-secondary)',
        'custom-tertiary': 'var(--bg-tertiary)',
        'custom-text-primary': 'var(--text-primary)',
        'custom-text-secondary': 'var(--text-secondary)',
        'custom-text-tertiary': 'var(--text-tertiary)',
        'custom-accent-focus': 'var(--accent-focus)',
        'custom-accent-green': 'var(--accent-green)',
        'custom-accent-yellow': 'var(--accent-yellow)',
        'custom-accent-red': 'var(--accent-red)',
        'custom-accent-indigo': 'var(--accent-indigo)',
        'custom-accent-sky': 'var(--accent-sky)',
      },
      borderColor: { // Also for borders if you use custom variables
        'custom-primary': 'var(--border-color-primary)',
        'custom-secondary': 'var(--border-color-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ensures Inter is the default sans-serif
      },
      borderRadius: {
        'custom-sm': 'var(--border-radius-sm)',
        'custom-md': 'var(--border-radius-md)',
      }
    },
  },
  plugins: [
    // You can add Tailwind plugins here if you use any
  ],
}

