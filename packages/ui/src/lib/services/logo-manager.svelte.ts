import futoDark from '$lib/assets/immich-logo-futo-dark.svg';
import futoLight from '$lib/assets/immich-logo-futo-light.svg';
import inlineDark from '$lib/assets/immich-logo-inline-dark.svg';
import inlineLight from '$lib/assets/immich-logo-inline-light.svg';
import stackedDark from '$lib/assets/immich-logo-stacked-dark.svg';
import stackedLight from '$lib/assets/immich-logo-stacked-light.svg';
import icon from '$lib/assets/immich-logo.svg';

import { Theme, type LogoSet, type LogoVariants } from '$lib/index.js';

const defaultLogos: LogoSet = {
  stacked: {
    light: stackedLight,
    dark: stackedDark,
  },
  unstacked: {
    light: inlineLight,
    dark: inlineDark,
  },
  stacked_futo: {
    light: futoLight,
    dark: futoDark,
  },
  icon,
};

class LogoManager {
  logos: LogoSet = $state(defaultLogos);

  getLogo(variant: LogoVariants, theme: Theme) {
    switch (variant) {
      case 'stacked': {
        return this.logos.stacked[theme];
      }
      case 'inline': {
        return this.logos.unstacked[theme];
      }
      case 'stacked-futo': {
        return this.logos.stacked_futo[theme];
      }
      default: {
        return this.logos.icon;
      }
    }
  }

  setLogo(logos: LogoSet) {
    this.logos = logos;
  }

  resetLogos() {
    this.logos = defaultLogos;
  }
}

export const logoManager = new LogoManager();
