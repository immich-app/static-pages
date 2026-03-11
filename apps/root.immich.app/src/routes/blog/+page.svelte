<script lang="ts">
  import { blogMetadata, posts } from '$lib';
  import { Button, Heading, Markdown, SiteMetadata, Stack, Text } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';
</script>

<SiteMetadata site={blogMetadata} />

<Heading size="title" tag="h1" fontWeight="bold" class="mb-1">Blog</Heading>
<Text color="muted" class="mt-4 mb-8">{blogMetadata.description}</Text>

<Stack gap={6}>
  {#each posts as post, i (post.url)}
    {@const { publishedAt, authors, description } = post}
    {#if i !== 0}
      <hr class="my-2 border" />
    {/if}
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

      <div class="mt-4 flex items-center justify-end">
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
  {/each}
</Stack>
