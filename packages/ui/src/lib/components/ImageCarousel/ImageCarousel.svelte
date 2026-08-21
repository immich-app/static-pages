<script lang="ts">
  import IconButton from '$lib/components/IconButton/IconButton.svelte';
  import ImageCard from '$lib/components/ImageCard/ImageCard.svelte';
  import { zIndex } from '$lib/constants.js';
  import { t } from '$lib/services/translation.svelte.js';
  import type { CarouselImageItem, TranslationProps } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';

  type Props = {
    items: CarouselImageItem[];
    scrollBy?: number;
    translations?: TranslationProps<'navigate_next' | 'navigate_previous'>;
    class?: string;
    child?: Snippet<[CarouselImageItem]>;
  };

  const { items, scrollBy = 400, translations, class: className, child = defaultChild }: Props = $props();

  let shouldRender = $derived(items.length > 0);

  let ref: HTMLElement | undefined = $state();
  let offsetWidth = $state(0);
  let innerWidth = $state(0);
  let scrollPosition = $state(0);

  let canScrollLeft = $derived(scrollPosition > 0);
  let canScrollRight = $derived(Math.ceil(scrollPosition) < Math.floor(innerWidth - offsetWidth));

  const onScroll = () => {
    scrollPosition = ref?.scrollLeft ?? 0;
  };

  const scrollLeft = () => ref?.scrollBy({ left: -scrollBy, behavior: 'smooth' });
  const scrollRight = () => ref?.scrollBy({ left: scrollBy, behavior: 'smooth' });
</script>

{#snippet defaultChild(item: CarouselImageItem)}
  <ImageCard {item} />
{/snippet}

{#if shouldRender}
  <section
    bind:this={ref}
    bind:clientWidth={offsetWidth}
    class={cleanClass('relative mt-3 overflow-x-scroll overflow-y-hidden whitespace-nowrap transition-all', className)}
    style="scrollbar-width:none"
    onscroll={onScroll}
  >
    {#if canScrollLeft || canScrollRight}
      <div class="sticky start-0 {zIndex.CarouselImage}">
        {#if canScrollLeft}
          <div class="light absolute start-4 top-27 -translate-y-1/2 max-md:top-19" transition:fade={{ duration: 200 }}>
            <IconButton
              icon={mdiChevronLeft}
              shape="round"
              variant="outline"
              color="secondary"
              class="opacity-50 hover:opacity-100"
              size="giant"
              aria-label={t('navigate_previous', translations)}
              onclick={scrollLeft}
            />
          </div>
        {/if}
        {#if canScrollRight}
          <div
            class="light absolute end-4 top-27 {zIndex.CarouselImage} -translate-y-1/2 max-md:top-19"
            transition:fade={{ duration: 200 }}
          >
            <IconButton
              icon={mdiChevronRight}
              shape="round"
              variant="outline"
              color="secondary"
              class="opacity-50 hover:opacity-100"
              size="giant"
              aria-label={t('navigate_next', translations)}
              onclick={scrollRight}
            />
          </div>
        {/if}
      </div>
    {/if}
    <div class="inline-block" bind:clientWidth={innerWidth}>
      {#each items as item, i (item.id ?? i)}
        {@render child(item)}
      {/each}
    </div>
  </section>
{/if}
