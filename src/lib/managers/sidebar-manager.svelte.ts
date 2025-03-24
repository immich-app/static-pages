class SidebarManager {
  isOpen = $state(true);

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

export const sidebarManager = new SidebarManager();
