let announcement = $state('');

export function announce(message: string) {
  announcement = '';
  requestAnimationFrame(() => {
    announcement = message;
  });
}

export function getAnnouncement() {
  return {
    get message() {
      return announcement;
    },
  };
}
