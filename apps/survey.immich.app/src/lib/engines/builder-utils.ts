import type { BuilderSection } from './builder-types';

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const newItems = [...items];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= newItems.length) {
    return newItems;
  }

  [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
  return newItems;
}

export function estimateCompletionSeconds(sections: BuilderSection[]): number {
  let total = 0;
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.type === 'textarea') total += 45;
      else if (q.type === 'text' || q.type === 'email') total += 20;
      else total += 15;
    }
  }
  return total;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return 'under 1 min';
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}
