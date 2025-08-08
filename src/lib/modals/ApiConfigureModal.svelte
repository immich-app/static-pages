<script lang="ts">
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Stack, Text } from '@immich/ui';
  import { mdiConnection } from '@mdi/js';

  let apiUrl = $state(localStorage.getItem('apiUrl') || '');
  let apiKey = $state(localStorage.getItem('apiKey') || '');
  let connected = $state(false);

  type Props = {
    onClose: (data?: { apiUrl: string; apiKey: string }) => void;
  };

  const { onClose }: Props = $props();

  const handleTest = async () => {
    connected = false;

    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.slice(0, -4);
    }

    try {
      const response = await fetch(`${apiUrl}/api/server/ping`, { headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        console.error('Failed to connect to Immich API:', response.statusText);
        return;
      }

      const data = await response.json();
      console.log('Connected to Immich API:', data);
      connected = true;
    } catch (error) {
      connected = false;
      console.error('Error connecting to Immich API:', error);
    }
  };

  const onsubmit = (e: Event) => {
    e.preventDefault();
    if (!apiUrl || !apiKey) {
      return;
    }

    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiUrl', apiUrl);

    onClose({ apiUrl, apiKey });
  };
</script>

<Modal title="Configure Immich API Access" icon={mdiConnection} size="small" {onClose}>
  <ModalBody>
    <form autocomplete="off" novalidate id="configure-form" {onsubmit}>
      <Stack gap={4}>
        <Text>Connecting to an Immich API makes it possible to see live responses for some endpoints.</Text>

        <Field label="Server URL">
          <Input bind:value={apiUrl} autocomplete="off" />
        </Field>

        {#if connected}
          <Text size="tiny" color="success" class="pt-2">Connected!</Text>
        {/if}

        <Field label="API Key">
          <Input bind:value={apiKey} autocomplete="off" />
        </Field>

        <hr class="my-1 border border-gray-500" />

        <div class="flex gap-2">
          <Button fullWidth color="secondary" size="small" onclick={handleTest}>Test Connection</Button>
        </div>

        <Text class="pb-4"
          >Note: In order to connect from this domain, CORS has to be enabled on the remote server.</Text
        >
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack gap={2} class="w-full">
      <Button fullWidth shape="round" color="secondary" onclick={() => onClose()}>Cancel</Button>
      <Button fullWidth shape="round" type="submit" form="configure-form" disabled={!connected}>Save</Button>
    </HStack>
  </ModalFooter>
</Modal>
