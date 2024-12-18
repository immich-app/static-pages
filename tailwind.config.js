/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./{apps,src}/**/*.{html,js,svelte,ts}', './node_modules/@immich/ui/dist/**/*.{svelte,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--immich-ui-primary) / <alpha-value>)',
        light: 'rgb(var(--immich-ui-light) / <alpha-value>)',
        dark: 'rgb(var(--immich-ui-dark) / <alpha-value>)',
        success: 'rgb(var(--immich-ui-success) / <alpha-value>)',
        danger: 'rgb(var(--immich-ui-danger) / <alpha-value>)',
        warning: 'rgb(var(--immich-ui-warning) / <alpha-value>)',
        info: 'rgb(var(--immich-ui-info) / <alpha-value>)',

        // Light Theme
        'immich-primary': 'rgb(var(--immich-primary) / <alpha-value>)',
        'immich-gray': 'rgb(var(--immich-gray) / <alpha-value>)',

        // Dark Theme
        'immich-dark-primary': 'rgb(var(--immich-dark-primary) / <alpha-value>)',
      },
      fontFamily: {
        'immich-title': ['Snowburst One', 'cursive'],
        'immich-mono': ['Overpass Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
      },
      screens: {
        tall: { raw: '(min-height: 800px)' },
      },
    },
  },
};
