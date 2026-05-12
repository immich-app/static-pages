<script lang="ts">
  import { Card, CardBody, Container, Heading, SiteMetadata, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';

  type Props = {
    attributes: {
      title: string;
      description: string;
      updatedAt: string;
    };
    children?: Snippet;
  };

  let { attributes, children }: Props = $props();

  const updatedAt = $derived(DateTime.fromISO(attributes.updatedAt).setZone('UTC'));
  const pageMetadata = $derived({
    title: attributes.title,
    description: attributes.description,
  });
</script>

<SiteMetadata page={pageMetadata} />

<Container size="medium" center>
  <section class="flex flex-col gap-2">
    <Heading tag="h1" size="title">{pageMetadata.title}</Heading>
    <Text color="muted">Last updated: {updatedAt.toLocaleString(DateTime.DATE_FULL)}</Text>
    <Text>{pageMetadata.description}</Text>
  </section>

  <Card color="secondary" class="mt-8">
    <CardBody class="pt-0">
      {@render children?.()}
    </CardBody>
  </Card>
</Container>
