<script lang="ts">
  /** A compact row of labelled stat values shown above a visualisation. */
  interface Stat {
    label: string;
    value: string;
    /** Optional accent colour for the value text */
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    /** Longer description shown as a tooltip */
    hint?: string;
  }

  interface Props {
    stats: Stat[];
  }

  let { stats }: Props = $props();

  function toneClass(tone?: Stat['tone']): string {
    switch (tone) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-gray-200';
    }
  }
</script>

<div class="flex flex-wrap items-baseline gap-x-6 gap-y-2">
  {#each stats as s (s.label)}
    <div title={s.hint ?? ''}>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">{s.label}</div>
      <div class="mt-0.5 text-xl font-bold tabular-nums {toneClass(s.tone)}">{s.value}</div>
    </div>
  {/each}
</div>
