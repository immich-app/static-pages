<script lang="ts">
  import Icon from '$lib/components/Icon/Icon.svelte';
  import type { CarouselImageItem, IconLike } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';

  type Props = {
    item: CarouselImageItem;
    leftIcons?: IconLike[];
    rightIcons?: IconLike[];
    class?: string;
  };

  const { item, leftIcons, rightIcons, class: className }: Props = $props();

  let left = $derived(leftIcons ?? item.leftIcons ?? []);
  let right = $derived(rightIcons ?? item.rightIcons ?? []);
</script>

<a
  class={cleanClass(
    'item-card relative me-2 inline-block aspect-3/4 h-54 rounded-xl last:me-0 max-md:h-37.5 md:me-4 md:aspect-4/3 xl:aspect-video',
    className,
  )}
  href={item.href}
>
  <img class="h-full w-full rounded-xl object-cover" src={item.src} alt={item.alt ?? item.title} draggable="false" />
  {#if left.length > 0}
    <div class="absolute top-3 left-3 flex gap-2 text-white drop-shadow-md">
      {#each left as icon, i (i)}
        <Icon {icon} size="1.5rem" aria-hidden />
      {/each}
    </div>
  {/if}
  {#if right.length > 0}
    <div class="absolute top-3 right-3 flex gap-2 text-white drop-shadow-md">
      {#each right as icon, i (i)}
        <Icon {icon} size="1.5rem" aria-hidden />
      {/each}
    </div>
  {/if}
  <div
    class="absolute inset-s-0 top-0 h-full w-full rounded-xl bg-linear-to-t from-black/40 via-transparent to-transparent transition-all hover:bg-black/20"
  ></div>
  <p class="absolute inset-s-4 bottom-2 text-lg text-white max-md:text-sm">
    {item.title}
  </p>
</a>

<style>
  .item-card {
    box-shadow:
      rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
  }
</style>
