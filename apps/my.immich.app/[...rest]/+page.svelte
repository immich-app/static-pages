<script lang="ts">
  import { StorageKey } from '$lib';
  import '$lib/app.css';
  import { Button, Card, CardBody, Field, Heading, HelperText, Input, Logo, Stack, Text } from '@immich/ui';
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
  };
</script>

<form onsubmit={handleSubmit}>
  <div class="p-4 md:p-12 lg:p-24">
    <div class="mx-auto max-w-screen-sm">
      <Card color="secondary" variant="subtle">
        <CardBody class="p-4 lg:p-8">
          <section>
            <div class="flex justify-center">
              <Logo variant="stacked" theme="dark" size="landing" />
            </div>
            <Stack gap={4}>
              <Heading size="large" color="primary">My Immich</Heading>

              <Text>My Immich allows public links to link you to specific areas of your personal Immich instance.</Text>

              <Field label="Instance URL">
                <Input
                  type="text"
                  placeholder="https://demo.immich.app/"
                  bind:value={instanceUrl}
                  oninput={handleChange}
                />
                <HelperText>Note: This URL is only stored in your browser.</HelperText>
              </Field>

              <div class="flex justify-end">
                {#if saved}
                  <Text size="small" color="primary">Saved!</Text>
                {:else}
                  <Button type="submit" class="w-full sm:w-auto">
                    {targetUrl ? 'Save & Redirect' : 'Save'}
                  </Button>
                {/if}
              </div>
            </Stack>
          </section>
        </CardBody>
      </Card>
    </div>
  </div>
</form>
