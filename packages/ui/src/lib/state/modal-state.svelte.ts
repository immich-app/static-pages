export class ModalEntry {
  isClosing = $state(false);

  constructor(readonly close?: () => Promise<void>) {}
}

class ModalState {
  #entries = $state<ModalEntry[]>([]);

  get entries() {
    return this.#entries;
  }

  add(entry: ModalEntry) {
    this.#entries.push(entry);
    return entry;
  }

  remove(entry: ModalEntry) {
    const index = this.#entries.indexOf(entry);
    if (index === -1) {
      return;
    }

    this.#entries.splice(index, 1);
  }

  isCovered(entry: ModalEntry) {
    const index = this.#entries.indexOf(entry);
    return index !== -1 && this.#entries.slice(index + 1).some(({ isClosing }) => !isClosing);
  }
}

export const modalState = new ModalState();
