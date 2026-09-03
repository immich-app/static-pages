const THEME_ROOT_PX = 17;
const COLUMN_PX = 42 * THEME_ROOT_PX; // Tailwind `max-w-2xl`
const GUTTER_PX = 2 * THEME_ROOT_PX; // `PageContent` padding

// Rem in a media query resolves against the browser's root size, not the theme's.
export const IMAGE_SIZES_QUERY = `(min-width: ${COLUMN_PX + GUTTER_PX}px) ${COLUMN_PX}px, calc(100vw - ${GUTTER_PX}px)`;
