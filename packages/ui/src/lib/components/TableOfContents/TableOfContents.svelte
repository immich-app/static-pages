<script lang="ts">
  import Text from '#lib/components/Text/Text.svelte';
  import { t } from '#lib/services/translation.svelte.js';
  import type { TableOfContentsItem, TableOfContentsProps } from '#lib/types.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { Previous, useIntersectionObserver, useResizeObserver, watch } from 'runed';
  import { SvelteSet } from 'svelte/reactivity';

  const { items, translations, class: className, ...restProps }: TableOfContentsProps = $props();

  const title = $derived(t('table_of_contents_title', translations));
  const entries = $derived(items.filter(({ id }) => id !== ''));

  type Block = { element: HTMLElement; section: number };

  const getBlocks = (items: TableOfContentsItem[]): Block[] => {
    const headings = items.map(({ id }) => document.querySelector(`#${CSS.escape(id)}`));
    const firstHeading = headings.find((heading) => heading !== null);
    const lastHeading = headings.findLast((heading) => heading !== null);
    if (!firstHeading || !lastHeading) {
      return [];
    }

    const range = document.createRange();
    range.setStartBefore(firstHeading);
    range.setEndAfter(lastHeading);
    const content = range.commonAncestorContainer;
    if (!(content instanceof Element)) {
      return [];
    }

    const blocks: Block[] = [];
    let section: number | undefined;
    for (const element of content.children) {
      const index = headings.findLastIndex((heading) => heading && element.contains(heading));
      if (index !== -1) {
        section = index;
      }
      if (section !== undefined && element instanceof HTMLElement) {
        blocks.push({ element, section });
      }
    }
    return blocks;
  };

  let blocks = $state<Block[]>([]);
  const visibleBlocks = new SvelteSet<Element>();

  watch(
    () => entries,
    (entries) => {
      blocks = getBlocks(entries);
    },
  );

  useIntersectionObserver(
    () => blocks.map(({ element }) => element),
    (entries) => {
      for (const { target, isIntersecting, boundingClientRect } of entries) {
        if (isIntersecting && boundingClientRect.height > 0) {
          visibleBlocks.add(target);
        } else {
          visibleBlocks.delete(target);
        }
      }
    },
    { threshold: 0 },
  );

  const highlight = $derived.by(() => {
    const visible = blocks.filter(({ element }) => visibleBlocks.has(element));
    const first = visible.at(0)?.section;
    const last = visible.at(-1)?.section;
    return first === undefined || last === undefined ? undefined : { first, last };
  });

  let list = $state<HTMLElement>();
  const listItems = $state<HTMLLIElement[]>([]);
  let bar = $state<{ top: number; height: number }>();
  const previousHighlight = new Previous(() => highlight);

  const measureBar = () => {
    if (!highlight) {
      return;
    }
    const first = listItems[highlight.first];
    const last = listItems[highlight.last];
    bar = { top: first.offsetTop, height: last.offsetTop + last.offsetHeight - first.offsetTop };
  };

  $effect(measureBar);
  useResizeObserver(() => list, measureBar);

  const isHighlighted = (index: number) => !!highlight && index >= highlight.first && index <= highlight.last;
</script>

<aside class={cleanClass('hidden w-56 shrink-0 xl:block', className)} aria-label={title} {...restProps}>
  <div class="sticky top-8">
    <Text color="muted" size="small" fontWeight="semi-bold">{title}</Text>
    <div class="relative mt-3">
      <ul bind:this={list} class="flex flex-col border-s text-sm">
        {#each entries as item, i (item.id)}
          <li bind:this={listItems[i]} class={item.level === 3 ? 'py-1 ps-6' : 'py-1 ps-3'}>
            <a
              href="#{item.id}"
              aria-current={highlight?.first === i ? 'location' : undefined}
              class={cleanClass(
                'hover:text-primary! block transition-colors rounded-xs outline-primary outline-offset-1 focus-visible:outline-2',
                isHighlighted(i) ? 'text-dark' : 'text-muted',
              )}
            >
              {item.text}
            </a>
          </li>
        {/each}
      </ul>
      {#if bar}
        <div
          class={cleanClass(
            'bg-primary pointer-events-none absolute -start-px w-0.5 duration-300 ease-out motion-reduce:transition-none',
            previousHighlight.current ? 'transition-all' : 'transition-opacity',
            highlight ? 'opacity-100' : 'opacity-0',
          )}
          style:top="{bar.top}px"
          style:height="{bar.height}px"
          aria-hidden="true"
        ></div>
      {/if}
    </div>
  </div>
</aside>
