<script lang="ts">
  import cloud from 'd3-cloud';
  import { select } from 'd3-selection';
  import { onMount } from 'svelte';

  interface CloudWord {
    text?: string;
    size?: number;
    x?: number;
    y?: number;
    rotate?: number;
  }

  interface Props {
    words: Array<{ text: string; count: number }>;
  }

  let { words }: Props = $props();
  let container: HTMLDivElement | undefined = $state();

  const COLORS = [
    '#60a5fa',
    '#4ade80',
    '#fb923c',
    '#a78bfa',
    '#f87171',
    '#2dd4bf',
    '#fbbf24',
    '#f472b6',
    '#94a3b8',
    '#818cf8',
  ];

  function renderCloud() {
    if (!container || words.length === 0) return;

    const width = container.clientWidth;
    const height = 250;
    const maxCount = Math.max(...words.map((w) => w.count));

    const cloudWords = words.slice(0, 80).map((w) => ({
      text: w.text,
      size: 12 + (w.count / maxCount) * 40,
    }));

    select(container as HTMLDivElement)
      .selectAll('svg')
      .remove();

    cloud()
      .size([width, height])
      .words(cloudWords)
      .padding(4)
      .rotate(() => (Math.random() > 0.7 ? 90 : 0))
      .fontSize((d: { size?: number }) => d.size ?? 12)
      .on('end', (output: Array<CloudWord>) => {
        const svg = select(container as HTMLDivElement)
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        svg
          .append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`)
          .selectAll('text')
          .data(output)
          .enter()
          .append('text')
          .style('font-size', (d: CloudWord) => `${d.size}px`)
          .style('fill', (_: CloudWord, i: number) => COLORS[i % COLORS.length])
          .style('font-family', 'system-ui, sans-serif')
          .style('cursor', 'default')
          .attr('text-anchor', 'middle')
          .attr('transform', (d: CloudWord) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text((d: CloudWord) => d.text ?? '');
      })
      .start();
  }

  onMount(() => {
    renderCloud();
  });

  $effect(() => {
    void words;
    renderCloud();
  });
</script>

<div bind:this={container} class="min-h-[250px] w-full"></div>
