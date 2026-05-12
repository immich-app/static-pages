<script lang="ts">
  import Container from '$lib/components/Container/Container.svelte';
  import Heading from '$lib/components/Heading/Heading.svelte';
  import SiteMetadata from '$lib/components/SiteMetadata/SiteMetadata.svelte';
  import Text from '$lib/components/Text/Text.svelte';
  import { type BreadcrumbItem, type ContainerSize } from '$lib/types.js';
  import type { Metadata } from '$lib/utilities/common.js';
  import type { Snippet } from 'svelte';

  type Props = {
    attributes: Metadata;
    size?: ContainerSize;
    breadcrumbs?: BreadcrumbItem[];
    title?: Snippet;
    description?: Snippet;
    children?: Snippet;
  };

  const { attributes: page, title, description, size = 'medium', children }: Props = $props();
</script>

<SiteMetadata {page} />

<Container {size} center class="my-4 flex flex-col p-4 lg:my-8">
  <section class="mb-8">
    <Heading tag="h1" size="giant">
      {#if title}
        {@render title()}
      {:else}
        {page.title}
      {/if}
    </Heading>
    {#if page.description || description}
      <Text color="muted" size="large" fontWeight="semi-bold" class="mt-2">
        {#if typeof description === 'function'}
          {@render description()}
        {:else}
          {page.description}
        {/if}
      </Text>
    {/if}
  </section>

  {@render children?.()}
</Container>
