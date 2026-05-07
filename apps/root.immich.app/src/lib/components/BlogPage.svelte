<script lang="ts">
  import { blogMetadata, posts } from '$lib';
  import { Heading, Icon, Link, Markdown, SiteMetadata, Text } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';

  type Props = {
    attributes: { id: string };
    children?: Snippet;
    postScript?: Snippet;
  };

  let { attributes, children, postScript }: Props = $props();
  const post = $derived(posts.find((blog) => blog.id === attributes.id)!);
  let { title, publishedAt, authors, description } = $derived(post);
</script>

<SiteMetadata site={blogMetadata} page={{ title, description }} />

<div>
  <ul class="flex place-items-center gap-1 text-muted">
    <li class="flex place-items-center">
      <Link href="/blog" underline={false}><span class="hover:underline">Blog</span></Link>
      <Icon icon={mdiChevronRight} size="1rem" />
    </li>
    <li>{title}</li>
  </ul>

  <Heading tag="h1" size="giant" class="mt-6">
    {#if post.draft}[Draft]{/if}
    {post.title}
  </Heading>

  <div class="mt-6 mb-2 flex gap-1">
    <Text color="muted" size="small" variant="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
    <Text color="muted" size="small">— {authors.join(', ')}</Text>
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
        <figcaption class="mt-2 text-center text-sm text-muted">
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
