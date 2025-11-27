<script lang="ts">
  import { blogMetadata } from '$lib';
  import { Heading, Icon, Link, Markdown, SiteMetadata, Text } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';

  type Props = {
    attributes: {
      title: string;
      publishedAt: string;
      modifiedAt?: string;
      authors: string[];
      description: string;
      draft?: boolean;
      coverUrl?: string;
      coverAlt?: string;
      coverAttribution?: string;
    };
    children?: Snippet;
    postScript?: Snippet;
  };

  let { attributes: post, children, postScript }: Props = $props();
  let { title, publishedAt, authors, description } = $derived({
    title: post.title,
    publishedAt: DateTime.fromISO(post.publishedAt),
    authors: post.authors,
    description: post.description,
  });
</script>

<SiteMetadata site={blogMetadata} page={{ title, description }} />

<div>
  <ul class="text-muted flex place-items-center gap-1">
    <li class="flex place-items-center">
      <Link href="/blog" underline={false}><span class="hover:underline">Blog</span></Link>
      <Icon icon={mdiChevronRight} size="1rem" />
    </li>
    <li>{title}</li>
  </ul>

  <Heading tag="h1" size="title" class="mt-6">
    {#if post.draft}[Draft]{/if}
    {post.title}
  </Heading>

  <div class="mb-2 flex gap-2">
    <Text color="muted" variant="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
    <Text color="muted">— {authors.join(', ')}</Text>
  </div>

  <Markdown.Paragraph><em>{description}</em></Markdown.Paragraph>

  {#if post.coverUrl}
    <figure class="my-6">
      <img
        src={post.coverUrl}
        alt={post.coverAlt ?? 'Blog cover image'}
        class="aspect-21/9 w-full rounded-lg border object-cover"
      />
      {#if post.coverAttribution}
        <figcaption class="text-muted mt-2 text-center text-sm">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html post.coverAttribution}
        </figcaption>
      {/if}
    </figure>
  {/if}

  <Markdown.LineBreak />
</div>

{@render children?.()}

<Text class="mt-4">Cheers,<br />The Immich Team</Text>

{#if postScript}
  <Markdown.LineBreak />
  <Markdown.Heading level={2} id="faqs">FAQs</Markdown.Heading>
  {@render postScript?.()}
{/if}
