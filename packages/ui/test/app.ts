import { page, userEvent } from 'vitest/browser';

const link = (name: string) => page.getByRole('link', { name, exact: true });

export const createApp = () => ({
  checkbox: (name: string) => page.getByRole('checkbox', { name, exact: true }),
  image: (name: string) => page.getByRole('img', { name, exact: true }),
  link,
  textarea: (label: string) => page.getByRole('textbox', { name: label, exact: true }),
  commandPalette: () => page.getByPlaceholder('Search...', { exact: true }),
  press: (keys: string) => userEvent.keyboard(keys),
  forceClick: (name: string) => link(name).click({ force: true }),
  pressTab: () => userEvent.tab(),
  field: (label: string) => page.getByLabelText(label, { exact: true }),
  text: (value: string) => page.getByText(value, { exact: true }),
  button: (name: string) => page.getByRole('button', { name, exact: true }),
  scrollerOf: (name: string) => page.getByRole('img', { name, exact: true }).element().closest('section')!,
  setDirection: (dir: 'ltr' | 'rtl') => document.documentElement.setAttribute('dir', dir),
  clickText: (text: string) => page.getByText(text, { exact: true }).click(),
  resizeWindow: (width: number) => page.viewport(width, 800),
  typeInField: async (label: string, text: string) => {
    page.getByLabelText(label, { exact: true }).element().focus();
    await userEvent.keyboard(text);
  },
  modal: (title: string) => page.getByRole('dialog').filter({ hasText: title }),
  modalCloseButton: (title: string) =>
    page.getByRole('dialog').filter({ hasText: title }).getByRole('button', { name: 'Close', exact: true }),
  pressKey: (key: string) => userEvent.keyboard(key),
});

export type App = ReturnType<typeof createApp>;
