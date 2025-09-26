<script lang="ts">
  import { posts } from '$lib/blog';
  import { Card, CardBody, CardHeader, CardTitle, Heading, Stack, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
</script>

<svelte:head>
  <title>Immich Blog</title>
  <meta name="description" content="Latest updates, announcements, and stories from the Immich team." />
  <meta property="og:title" content="Immich Blog" />
  <meta property="og:description" content="Latest updates, announcements, and stories from the Immich team." />
  <meta name="twitter:title" content="Immich Blog" />
  <meta name="twitter:description" content="Latest updates, announcements, and stories from the Immich team." />
</svelte:head>
<Stack gap={8}>
  <section class="flex flex-col gap-2">
    <Heading size="title" tag="h1" fontWeight="bold">Blog</Heading>
    <Text color="muted">{posts.length} posts</Text>
  </section>

  {#each posts as post (post.url)}
    <a href={post.url} class="group">
      <Card color="secondary">
        <CardHeader class="group-hover:text-primary">
          <CardTitle class="flex gap-1">
            <Text color={post.isDraft ? 'muted' : undefined}>
              {#if post.isDraft}[Draft]{/if}
              {post.title}
            </Text>
          </CardTitle>
          <div class="flex gap-2">
            <Text color="muted" variant="italic">{post.publishedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
            <Text color="muted">— {post.authors.join(', ')}</Text>
          </div>
        </CardHeader>
        <CardBody>{post.description}</CardBody>
      </Card>
    </a>
  {/each}
</Stack>
