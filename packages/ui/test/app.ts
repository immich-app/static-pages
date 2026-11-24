import { page, userEvent } from 'vitest/browser';

const link = (name: string) => page.getByRole('link', { name, exact: true });

export const createApp = () => ({
  image: (name: string) => page.getByRole('img', { name, exact: true }),
  link,
  textarea: (label: string) => page.getByRole('textbox', { name: label, exact: true }),
  commandPalette: () => page.getByPlaceholder('Search...', { exact: true }),
  press: (keys: string) => userEvent.keyboard(keys),
  forceClick: (name: string) => link(name).click({ force: true }),
  pressTab: () => userEvent.tab(),
  resizeWindow: (width: number) => page.viewport(width, 800),
});

export type App = ReturnType<typeof createApp>;
