import { type Metadata } from '$lib/utilities/common.js';

class GlobalManager {
  #siteMetadata = $state<Metadata>();

  get siteMetadata() {
    if (!this.#siteMetadata) {
      throw new Error('No site metadata!');
    }

    return this.#siteMetadata;
  }

  setSiteMetadata(site: Metadata) {
    this.#siteMetadata = site;
  }
}

export const globalManager = new GlobalManager();
