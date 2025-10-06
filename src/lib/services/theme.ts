import { writable } from 'svelte/store';

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

function getInitialTheme() {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark')
      ? Theme.Dark
      : Theme.Light;
  }

  return Theme.Light;
}

export const theme = writable(getInitialTheme());