import { page, userEvent } from 'vitest/browser';

export const createApp = () => ({
  image: (name: string) => page.getByRole('img', { name, exact: true }),
  textarea: (label: string) => page.getByRole('textbox', { name: label, exact: true }),
  commandPalette: () => page.getByPlaceholder('Search...', { exact: true }),
  press: (keys: string) => userEvent.keyboard(keys),
  resizeWindow: (width: number) => page.viewport(width, 800),
});

export type App = ReturnType<typeof createApp>;
