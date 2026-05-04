export const asSlug = (value: string) =>
  value.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '');

export const asComponentHref = (componentName: string) => `/components/${asSlug(componentName)}`;
