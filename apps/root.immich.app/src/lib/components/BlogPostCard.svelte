<script lang="ts">
  import { type BlogPost } from '#lib';
  import { Button, Heading, IMAGE_SIZES_QUERY } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { DateTime } from 'luxon';

  type Props = {
    post: BlogPost;
  };

  const { post }: Props = $props();
  const { publishedAt, authors, description } = $derived(post);
</script>

{#snippet content(cover: boolean)}
  <div class={['flex flex-col justify-between gap-6', cover && 'min-h-80']}>
    <div>
      <div class="flex items-start justify-between gap-4">
        <a href={post.url} class="after:absolute after:inset-0 hover:underline">
          <Heading size="large" class={cover ? 'font-medium drop-shadow-md' : 'font-medium'}>{post.title}</Heading>
        </a>
        <div class="relative z-10 hidden shrink-0 sm:block">
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
      <div class={['mt-2 flex flex-wrap gap-1 text-sm', cover ? 'text-white/80 drop-shadow-md' : 'text-muted']}>
        <span class="italic">{publishedAt.toLocaleString(DateTime.DATE_FULL)}</span>
        <span>— {authors.join(', ')}</span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <p class={['text-sm', cover && 'text-white drop-shadow-md']}>{description}</p>
      <div class="relative z-10 sm:hidden">
        <Button
          trailingIcon={mdiChevronRight}
          shape="semi-round"
          size="small"
          color="primary"
          href={post.url}
          fullWidth
        >
          Read
        </Button>
      </div>
    </div>
  </div>
{/snippet}

{#if post.coverUrl}
  <div class="group relative overflow-hidden rounded-lg">
    <img
      src={post.coverUrl}
      srcset={post.coverSrcset}
      sizes={post.coverSrcset && IMAGE_SIZES_QUERY}
      alt={post.coverAlt}
      width={post.coverWidth}
      height={post.coverHeight}
      loading="lazy"
      class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
    />
    <div
      class="absolute inset-0 bg-linear-to-b from-black/90 from-10% via-black/0 via-25% to-black/90 sm:via-55% sm:to-black/75"
    ></div>
    <div class="relative p-4 text-white sm:p-6">
      {@render content(true)}
    </div>
  </div>
{:else}
  <div
    class="group relative rounded-lg border border-primary bg-primary-50 p-4 transition-colors hover:bg-primary-100 sm:p-6 dark:border-0"
  >
    {@render content(false)}
  </div>
{/if}
