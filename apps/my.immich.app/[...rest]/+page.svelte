<script lang="ts">
  import { StorageKey } from '$lib';
  import '$lib/app.css';
  import FullPageLayout from '$lib/components/FullPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Heading,
    Icon,
    Input,
    Logo,
    Stack,
    SupporterBadge,
    Text,
  } from '@immich/ui';
  import { mdiCheckCircleOutline } from '@mdi/js';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const targetUrl = data.targetUrl;
  let instanceUrl = $state(data.instanceUrl);
  let saved = $state(false);

  const handleChange = () => (saved = false);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    localStorage.setItem(StorageKey.INSTANCE_URL, instanceUrl);
    if (targetUrl && instanceUrl) {
      window.location.href = new URL(targetUrl, instanceUrl).toString();
    } else {
      saved = true;
    }

    setTimeout(() => {
      saved = false;
    }, 3000);
  };
</script>

<FullPageLayout width="sm">
  <Stack gap={8} class="min-h-[75vh]">
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary">My Immich</Heading>
    </SupporterBadge>
    <Text>My Immich allows public links to link you to specific areas of your personal Immich instance.</Text>

    <form onsubmit={handleSubmit}>
      <Card color="secondary" variant="subtle">
        <CardHeader>
          <CardTitle>Instance URL</CardTitle>
          <CardDescription>This URL is only stored in your browser</CardDescription>
        </CardHeader>
        <CardBody>
          <section>
            <Stack gap={4}>
              <Input
                type="text"
                placeholder="https://demo.immich.app/"
                bind:value={instanceUrl}
                oninput={handleChange}
              />
            </Stack>
          </section>
        </CardBody>
        <CardFooter class="justify-end">
          <Button type="submit" class="w-full sm:w-auto" disabled={saved}>
            {#if saved}
              <Icon icon={mdiCheckCircleOutline} />
              Saved!
            {:else}
              {targetUrl ? 'Save & Redirect' : 'Save'}
            {/if}
          </Button>
        </CardFooter>
      </Card>
    </form>
  </Stack>
</FullPageLayout>
