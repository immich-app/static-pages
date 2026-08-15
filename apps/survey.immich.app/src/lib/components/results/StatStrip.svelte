<script lang="ts">
  interface Stat {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
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
