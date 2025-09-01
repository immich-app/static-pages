<script lang="ts">
  import { goto } from '$app/navigation';
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import type { Feature } from '$lib/types';
  import { features } from '$lib/utilities';
  import {
    AppShell,
    AppShellHeader,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    Heading,
    Icon,
    Modal,
    ModalBody,
    Stack,
    Text,
  } from '@immich/ui';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let feature = $derived<Feature | undefined>(data.feature);
</script>

{#if feature}
  <Modal title={feature.title} onClose={() => goto('/features')}>
    <ModalBody>
      <feature.content />
    </ModalBody>
  </Modal>
{/if}

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent class="mx-auto max-w-screen-lg">
    <Stack gap={8}>
      <Stack>
        <Heading size="title">Features</Heading>
        <Text>Immich is packed with features!</Text>
      </Stack>

      <Stack gap={2}>
        <section class="grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each features as feature}
            <a href={feature.href}>
              <Card color="secondary" class="h-full transition-all border-subtle hover:border-primary border-2">
                <CardHeader>
                  <Heading color="primary" size="tiny">{feature.title}</Heading>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardBody class="flex align-middle items-center justify-center text-primary">
                  <Icon icon={feature.icon} size="3rem" class="m-5" />
                </CardBody>
              </Card>
            </a>
          {/each}
        </section>
      </Stack>
    </Stack>
  </PageContent>
</AppShell>
