<script lang="ts">
  import { playgroundManager } from '$lib/services/playground-manager.svelte';
  import { Button, Code, Field, HStack, Input, Modal, ModalBody, ModalFooter, Stack, Text } from '@immich/ui';
  import { mdiConnection } from '@mdi/js';

  let apiUrl = $state(playgroundManager.serverUrl || '');
  let apiKey = $state(playgroundManager.apiKey || '');
  let errorMessage = $state<string | null>(null);

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unknown error occurred';
    }
  };

  const handleDemoLogin = async () => {
    try {
      errorMessage = null;
      await playgroundManager.connectToDemo();
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDisconnect = async () => {
    playgroundManager.reset();
    onClose();
  };

  const onsubmit = async (event?: Event) => {
    event?.preventDefault();
    if (!apiKey) {
      return;
    }

    try {
      errorMessage = null;
      await playgroundManager.connectToServer(apiUrl, apiKey);
      onClose();
    } catch (error) {
      handleError(error);
    }
  };
</script>

<Modal title="Configure Immich API Access" icon={mdiConnection} size="small" {onClose}>
  <ModalBody>
    <form autocomplete="off" novalidate id="configure-form" {onsubmit}>
      <Stack gap={4}>
        {#if playgroundManager.connected}
          <div class="flex items-center gap-1">
            <Text>
              Connected to <Code>{playgroundManager.serverUrl}</Code>
            </Text>
          </div>

          {#if playgroundManager.serverVersion}
            <div class="flex items-center gap-1">
              <Text>
                Server version <Code>{playgroundManager.serverVersion.value}</Code>
              </Text>
            </div>
          {/if}
        {:else}
          {#if errorMessage}
            <Text class="rounded-lg border border-red-900 bg-red-100 p-4 pb-4 dark:border-red-100 dark:bg-red-900"
              >{errorMessage}</Text
            >
          {/if}
          <Text>Connecting to an Immich API makes it possible to see live responses for some endpoints.</Text>

          <Button type="button" size="small" color="info" shape="round" onclick={handleDemoLogin}
            >Use the demo server</Button
          >

          <Field label="Server URL">
            <Input bind:value={apiUrl} autocomplete="off" />
          </Field>

          <Field label="API Key">
            <Input bind:value={apiKey} autocomplete="off" />
          </Field>

          <hr class="my-1 border border-gray-500" />

          <Text
            class="rounded-lg border border-yellow-900 bg-yellow-100 p-4 pb-4 dark:border-yellow-100 dark:bg-yellow-900"
            >Note: In order to connect, CORS has to be enabled on the remote server.</Text
          >
        {/if}
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack gap={2} class="w-full">
      {#if playgroundManager.connected}
        <Button fullWidth shape="round" color="secondary" onclick={onClose}>Cancel</Button>
        <Button fullWidth shape="round" color="warning" type="button" onclick={() => handleDisconnect()}
          >Disconnect</Button
        >
      {:else}
        <Button fullWidth shape="round" color="secondary" onclick={onClose}>Cancel</Button>
        <Button fullWidth shape="round" type="submit" form="configure-form">Save</Button>
      {/if}
    </HStack>
  </ModalFooter>
</Modal>
