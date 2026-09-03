<script lang="ts">
  import Text from '$lib/components/Text/Text.svelte';
  import { t } from '$lib/services/translation.svelte.js';
  import type { TableOfContentsProps } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';

  const { items, translations, class: className, ...restProps }: TableOfContentsProps = $props();

  const title = $derived(t('table_of_contents_title', translations));
</script>

<aside class={cleanClass('hidden w-56 shrink-0 xl:block', className)} aria-label={title} {...restProps}>
  <div class="sticky top-8">
    <Text color="muted" size="small" fontWeight="semi-bold">{title}</Text>
    <ul class="mt-3 flex flex-col gap-2 border-s text-sm">
      {#each items as item (item.id)}
        <li class={item.level === 3 ? 'ps-6' : 'ps-3'}>
          <a href="#{item.id}" class="text-muted hover:text-primary block transition-colors">{item.text}</a>
        </li>
      {/each}
    </ul>
  </div>
</aside>
