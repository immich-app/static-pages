<script lang="ts">
  import { asBlogPost, blogMetadata, BlogType, getPostNeighbors, posts } from '$lib';
  import BlogTypeBadge from '$lib/components/BlogTypeBadge.svelte';
  import {
    Heading,
    Icon,
    Link,
    Markdown,
    PageFooterNavigation,
    SiteMetadata,
    TableOfContents,
    Text,
    type TableOfContentsItem,
  } from '@immich/ui';
  import type { BlogPost, SerializedPost } from '$lib/types';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';

  type Props = {
    doc: SerializedPost;
    children?: Snippet;
    postScript?: Snippet;
  };

  let { doc, children, postScript }: Props = $props();
  const post = $derived(asBlogPost(doc));
  let { title, publishedAt, authors, description } = $derived(post);
  const alt = $derived(post.coverAlt ?? 'Blog cover image');
  const headers: TableOfContentsItem[] = $derived([
    ...post.headers,
    ...(postScript ? [{ id: 'faqs', text: 'FAQs', level: 2 }] : []),
  ]);
  const { previous, next } = $derived(getPostNeighbors(posts, post));

  const asNavigationLink = (item?: BlogPost) => (item ? { title: item.title, href: item.url } : undefined);
</script>

<SiteMetadata site={blogMetadata} page={{ title, description }} />

<div class="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr]">
  <article
    class={['mx-auto w-full min-w-0 xl:col-start-2', post.type === BlogType.Release ? 'max-w-3xl' : 'max-w-2xl']}
  >
    <div>
      <ul class="flex place-items-center gap-1 text-muted">
        <li class="flex place-items-center">
          <Link href="/blog" underline={false}><span class="hover:underline">Blog</span></Link>
          <Icon icon={mdiChevronRight} size="1rem" />
        </li>
        <li>{title}</li>
      </ul>

      <Heading tag="h1" size="giant" class="mt-6">
        {post.title}
      </Heading>

      <div class="mt-4 mb-2 flex gap-1">
        <Text color="muted" size="small" variant="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
        <Text color="muted" size="small">— {authors.join(', ')}</Text>
      </div>

      <Markdown.Paragraph><em>{description}</em></Markdown.Paragraph>

      <BlogTypeBadge class="mt-2" size="small" type={post.type} />

      {#if post.coverUrl}
        <Markdown.Image
          src={post.coverUrl}
          srcset={post.coverSrcset}
          width={post.coverWidth}
          height={post.coverHeight}
          {alt}
          priority
        >
          {#snippet caption()}
            {#if post.coverAttribution}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html post.coverAttribution} - {alt}
            {:else}
              {alt}
            {/if}
          {/snippet}
        </Markdown.Image>
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

    <PageFooterNavigation previous={asNavigationLink(previous)} next={asNavigationLink(next)} />
  </article>

  {#if headers.length > 1}
    <TableOfContents items={headers} class="ms-8 xl:col-start-3" />
  {/if}
</div>
