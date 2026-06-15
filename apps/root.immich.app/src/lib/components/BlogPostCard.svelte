<script lang="ts">
  import { type BlogPost, type BlogType } from '$lib';
  import BlogTypeBadge from '$lib/components/BlogTypeBadge.svelte';
  import { Button, Heading, Markdown, Text } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';

  type Props = {
    post: BlogPost;
    type?: BlogType;
  };

  const { post, type }: Props = $props();
  const { publishedAt, authors, description } = $derived(post);
</script>

<div>
  <a href={post.url} class="hover:text-primary">
    <Heading color={post.draft ? 'muted' : undefined} size="large" class="font-medium">
      {#if post.draft}[Draft]{/if}
      {post.title}
    </Heading>
  </a>

  <div class="mt-2 mb-4 flex gap-1">
    <Text color="muted" size="small" variant="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
    <Text color="muted" size="small">— {authors.join(', ')}</Text>
  </div>

  {#if post.coverUrl}
    <img src={post.coverUrl} alt={post.coverAlt} class="overflow-hidden rounded-lg" />
  {/if}

  <div class="mt-4">
    <Markdown.Paragraph><em>{description}</em></Markdown.Paragraph>
  </div>

  <div class="mt-4 flex items-center justify-between">
    <div>
      {#if !type}
        <BlogTypeBadge size="small" type={post.type} />
      {/if}
    </div>

    <div class="flex items-end">
      <Button
        trailingIcon={mdiChevronRight}
        shape="semi-round"
        variant="filled"
        size="small"
        color="primary"
        href={post.url}
      >
        Read
      </Button>
    </div>
  </div>
</div>
