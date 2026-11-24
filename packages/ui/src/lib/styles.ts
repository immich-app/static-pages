import { cleanClass } from '#lib/utilities/internal.js';
import { tv } from 'tailwind-variants';

const color = {
  primary: 'text-primary',
  secondary: 'text-dark',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

export const styleVariants = {
  color,
  textColor: {
    ...color,
    muted: 'text-gray-600 dark:text-gray-400',
  },

  inputSegmentCommon:
    'focus:bg-light-300 focus:text-light-900 dark:focus:bg-light-700 dark:focus:text-light-100 rounded tabular-nums outline-none',
  inputCommon:
    'disabled:text-dark dark:disabled:text-gray-200 bg-transparent transition outline-none disabled:cursor-not-allowed',
  inputContainerCommon:
    'bg-gray-100 ring-1 ring-gray-200 focus-within:ring-primary dark:focus-within:ring-primary transition outline-none data-disabled:cursor-not-allowed dark:bg-gray-800 dark:ring-neutral-700 data-disabled:bg-light-300 data-disabled:dark:bg-gray-900 has-user-invalid:focus-within:ring-danger has-user-invalid:dark:focus-within:ring-danger has-user-invalid:ring-danger-300 has-user-invalid:dark:ring-danger-300',
  inputContainerBits:
    'data-disabled:text-dark data-disabled:dark:text-gray-200 data-invalid:focus-within:ring-danger data-invalid:dark:focus-within:ring-danger data-invalid:ring-danger-300 data-invalid:dark:ring-danger-300',

  shape: {
    rectangle: 'rounded-none',
    'semi-round': '',
    round: 'rounded-full',
  },

  inputRoundedSize: {
    tiny: 'rounded-lg',
    small: 'rounded-lg',
    medium: 'rounded-lg',
    large: 'rounded-lg',
    giant: 'rounded-lg',
  },

  border: {
    true: 'border',
    false: '',
  },

  borderColor: {
    primary: 'border-primary',
    secondary: 'border-dark',
    success: 'border-success',
    danger: 'border-danger',
    warning: 'border-warning',
    info: 'border-info',
  },

  fillColor: {
    primary: 'fill-primary',
    secondary: 'fill-dark',
    success: 'fill-success',
    danger: 'fill-danger',
    warning: 'fill-warning',
    info: 'fill-info',
  },

  filledColor: {
    primary: 'bg-primary text-light',
    secondary: 'bg-dark text-light',
    success: 'bg-success text-light',
    danger: 'bg-danger text-light',
    warning: 'bg-warning text-light',
    info: 'bg-info text-light',
  },

  filledColorHover: {
    primary: 'not-disabled:hover:bg-primary/80',
    secondary: 'not-disabled:hover:bg-dark/80',
    success: 'not-disabled:hover:bg-success/80',
    danger: 'not-disabled:hover:bg-danger/80',
    warning: 'not-disabled:hover:bg-warning/80',
    info: 'not-disabled:hover:bg-info/80',
  },

  buttonPadding: {
    tiny: 'px-3 py-1',
    small: 'px-4 py-2',
    medium: 'px-5 py-2',
    large: 'px-8 py-2.5',
    giant: 'px-10 py-3',
  },
  buttonRoundedSize: {
    tiny: 'rounded-lg',
    small: 'rounded-lg',
    medium: 'rounded-xl',
    large: 'rounded-xl',
    giant: 'rounded-2xl',
  },
  focusOutlineColor: {
    primary: 'outline-primary',
    secondary: 'outline-dark',
    success: 'outline-success',
    danger: 'outline-danger',
    warning: 'outline-warning',
    info: 'outline-info',
  },
  outlineColor: {
    primary: 'border-primary bg-primary/10 text-primary not-disabled:hover:bg-primary/20 border',
    secondary: 'border-dark bg-light-100 text-dark not-disabled:hover:bg-light-200 border',
    success: 'border-success bg-success/10 text-success not-disabled:hover:bg-success/20 border',
    danger: 'border-danger bg-danger/10 text-danger not-disabled:hover:bg-danger/20 border',
    warning: 'border-warning bg-warning/10 text-warning not-disabled:hover:bg-warning/20 border',
    info: 'border-info bg-info/10 text-info not-disabled:hover:bg-info/20 border',
  },
  ghostColor: {
    primary: 'text-primary not-disabled:hover:bg-primary/15',
    secondary: 'text-dark not-disabled:hover:bg-dark/10',
    success: 'text-success not-disabled:hover:bg-success/15',
    danger: 'text-danger not-disabled:hover:bg-danger/15',
    warning: 'text-warning not-disabled:hover:bg-warning/15',
    info: 'text-info not-disabled:hover:bg-info/15',
  },

  textSize: {
    tiny: 'text-xs',
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    giant: 'text-xl',
  },

  fontWeight: {
    thin: 'font-thin',
    'extra-light': 'font-extralight',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    'semi-bold': 'font-semibold',
    bold: 'font-bold',
    'extra-bold': 'font-extrabold',
    black: 'font-black',
  },

  tableSpacing: {
    tiny: '',
    small: 'py-1',
    medium: 'py-2',
    large: 'py-3',
    giant: 'py-4',
  },
};

export const inputSegmentStyles = tv({
  base: styleVariants.inputSegmentCommon,
  variants: {
    padding: {
      narrow: 'p-0.5',
      wide: 'px-1 py-0.5',
    },
  },
});

export const inputStyles = tv({
  base: cleanClass(styleVariants.inputCommon, 'w-full flex-1 py-2.5'),
  variants: {
    textSize: styleVariants.textSize,
    leadingPadding: {
      base: 'ps-4',
      icon: 'ps-0',
    },
    trailingPadding: {
      base: 'pe-4',
      icon: 'pe-0',
    },
    roundedSize: {
      tiny: 'rounded-lg',
      small: 'rounded-lg',
      medium: 'rounded-lg',
      large: 'rounded-lg',
      giant: 'rounded-lg',
    },
  },
});

export const inputContainerStyles = tv({
  base: cleanClass(styleVariants.inputContainerCommon, styleVariants.inputContainerBits, 'flex w-full items-center'),
  variants: {
    shape: styleVariants.shape,
    roundedSize: styleVariants.inputRoundedSize,
    invalid: {
      true: 'focus-within:ring-danger dark:focus-within:ring-danger dark:ring-danger-300 ring-danger-300',
    },
  },
});
