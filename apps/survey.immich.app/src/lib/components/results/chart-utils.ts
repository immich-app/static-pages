export function getChartColors() {
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    textColor: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
    gridColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
    isDark,
  };
}

export const CHART_PALETTE = [
  'rgb(96, 165, 250)',
  'rgb(74, 222, 128)',
  'rgb(251, 146, 60)',
  'rgb(167, 139, 250)',
  'rgb(248, 113, 113)',
  'rgb(45, 212, 191)',
  'rgb(251, 191, 36)',
  'rgb(244, 114, 182)',
  'rgb(148, 163, 184)',
  'rgb(129, 140, 248)',
];
