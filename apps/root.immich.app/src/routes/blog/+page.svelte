<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { blogMetadata, BlogType, isBlogType, posts, typeToLabel } from '$lib';
  import BlogPostCard from '$lib/components/BlogPostCard.svelte';
  import { Routes } from '$lib/route';
  import { Badge, Heading, SiteMetadata, Stack, Text } from '@immich/ui';

  const fromParam = <T extends string>(name: string, isValid: (value: string) => value is T) => {
    if (!browser) {
      return;
    }

    const params = page.url.searchParams;
    if (!params.has(name)) {
      return;
    }

    const value = params.get(name);

    if (!value || !isValid(value)) {
      return;
    }

    return value as T;
  };

  let selected = $derived(fromParam<BlogType>('type', isBlogType));
</script>

<SiteMetadata site={blogMetadata} />

<Heading size="title" tag="h1" fontWeight="bold" class="mb-1">Blog</Heading>
<Text color="muted" class="mt-4">{blogMetadata.description}</Text>

<div class="flex flex-wrap gap-1">
  <a href={Routes.blog()}>
    <Badge class="mt-2" color={selected ? 'secondary' : 'primary'}>All</Badge>
  </a>
  {#each Object.values(BlogType) as type (type)}
    <a href={Routes.blog({ type })}>
      <Badge class="mt-2" color={selected === type ? 'primary' : 'secondary'}>{typeToLabel(type)}</Badge>
    </a>
  {/each}
</div>

<hr class="my-4" />

<Stack gap={6} class="mt-8">
  {#each posts.filter((post) => !selected || selected === post.type) as post, i (post.url)}
    {#if i !== 0}
      <hr class="my-2 border" />
    {/if}
    <BlogPostCard {post} type={selected} />
  {/each}
</Stack>
