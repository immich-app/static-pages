<script lang="ts">
  import PageDescription from '$lib/components/PageDescription.svelte';
  import { locales, siteMetadata } from '$lib/constants';
  import {
    Container,
    getLocale,
    Heading,
    Select,
    setLocale,
    SiteMetadata,
    type BreadcrumbItem,
    type ContainerSize,
  } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    attributes: { title: string; description: string };
    localeSensitive?: boolean;
    size?: ContainerSize;
    breadcrumbs?: BreadcrumbItem[];
    children?: Snippet;
  };

  const { attributes, localeSensitive = false, size = 'medium', children }: Props = $props();
  const { title, description } = $derived(attributes);

  const page = $derived({ title, description });

  const options = [
    { value: 'none', label: 'Select locale', disabled: true },
    ...locales.map(({ code, name }) => ({ value: code, label: name })),
  ];
</script>

<SiteMetadata site={siteMetadata} {page} />

<Container {size} center class="my-4 flex flex-col p-4 lg:my-8">
  <section class="mb-8">
    <div class="flex justify-between">
      <Heading tag="h1" size="giant">{page.title}</Heading>
      {#if localeSensitive}
        <Select class="w-60" {options} value={getLocale() || 'none'} onChange={setLocale} />
      {/if}
    </div>
    {#if page.description}
      <PageDescription>{page.description}</PageDescription>
    {/if}
  </section>

  {@render children?.()}
</Container>
