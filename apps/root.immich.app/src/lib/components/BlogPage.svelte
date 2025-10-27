<script lang="ts">
  import type { BlogPost } from '$lib';
  import { blogMetadata } from '$lib';
  import { Heading, Icon, Link, SiteMetadata, Stack, Text } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';

  type Props = {
    post: BlogPost;
    children?: Snippet;
    postScript?: Snippet;
  };

  let { post, children, postScript }: Props = $props();
  let { title, publishedAt, authors, description } = $derived(post);
</script>

<SiteMetadata site={blogMetadata} page={{ title, description }} />

<Stack gap={2}>
  <ul class="text-muted flex place-items-center gap-1">
    <li class="flex place-items-center">
      <Link href="/blog" underline={false}><span class="hover:underline">Blog</span></Link>
      <Icon icon={mdiChevronRight} size="1rem" />
    </li>
    <li>{title}</li>
  </ul>

  <Heading tag="h1" size="title" class="mt-6">
    {#if post.isDraft}[Draft]{/if}
    {post.title}
  </Heading>

  <div class="mb-2 flex gap-2">
    <Text color="muted" variant="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
    <Text color="muted">— {authors.join(', ')}</Text>
  </div>

  {@render children?.()}

  <Text class="mt-4">Cheers,<br />The Immich Team</Text>
</Stack>

{#if postScript}
  <hr />
  {@render postScript?.()}
{/if}
