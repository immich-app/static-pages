<script lang="ts">
  import Icon from '$lib/components/Icon/Icon.svelte';
  import Text from '$lib/components/Text/Text.svelte';
  import { t } from '$lib/services/translation.svelte.js';
  import type { PageFooterNavigationProps } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

  const { previous, next, translations, class: className, ...restProps }: PageFooterNavigationProps = $props();

  const label = $derived(t('page_footer_navigation_label', translations));
</script>

{#if previous || next}
  <nav class={cleanClass('mt-8 grid gap-4 border-t pt-8 sm:grid-cols-2', className)} aria-label={label} {...restProps}>
    {#if previous}
      <a
        href={previous.href}
        class="hover:border-primary hover:text-primary flex items-center gap-2 rounded-xl border p-4 transition-colors"
      >
        <Icon icon={mdiChevronLeft} size="1.5rem" />
        <div class="min-w-0">
          <Text color="muted" size="tiny">{t('navigate_previous', translations)}</Text>
          <Text fontWeight="semi-bold" class="truncate">{previous.title}</Text>
        </div>
      </a>
    {:else}
      <div></div>
    {/if}
    {#if next}
      <a
        href={next.href}
        class="hover:border-primary hover:text-primary flex items-center justify-end gap-2 rounded-xl border p-4 text-end transition-colors"
      >
        <div class="min-w-0">
          <Text color="muted" size="tiny">{t('navigate_next', translations)}</Text>
          <Text fontWeight="semi-bold" class="truncate">{next.title}</Text>
        </div>
        <Icon icon={mdiChevronRight} size="1.5rem" />
      </a>
    {/if}
  </nav>
{/if}
