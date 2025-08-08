<script lang="ts">
  import { type ApiEndpoint } from '$lib/api/services/open-api';
  import { playgroundManager } from '$lib/api/services/playground-manager.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import { Button, Code, Field, Input, Label, Select, Stack, Text } from '@immich/ui';
  import { json } from 'svelte-highlight/languages';

  type Response = {
    ok: boolean;
    status: number;
    body: string;
  };

  type Props = {
    endpoint: ApiEndpoint;
  };

  const { endpoint }: Props = $props();

  let response = $state<Response | undefined>();

  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({ label: method, value: method }));
  let selectedMethod = $derived(httpMethods.find(({ value }) => value === endpoint?.method) ?? httpMethods[0]);
  let requestUrl = $derived<string>(endpoint?.route ?? '');
  let requestBody = $state<string>('');

  const handleSend = async () => {
    if (!endpoint) {
      return;
    }

    const result = await playgroundManager.sendRequest({
      method: selectedMethod.value,
      url: requestUrl,
      body: requestBody,
    });
    let body = await result.json();
    if (Array.isArray(body) && body.length > 500) {
      body = body.slice(0, 500);
      body.push({ note: 'Response truncated to first 500 items' });
    }

    response = {
      ok: result.ok,
      status: result.status,
      body: JSON.stringify(body, null, 4),
    };
  };
</script>

{#if playgroundManager.connected}
  <div class="flex flex-col gap-4">
    <div class="flex gap-2">
      <div class="max-w-32">
        <Field label="Method">
          <Select bind:value={selectedMethod} data={httpMethods} class="mt-1.5" />
        </Field>
      </div>
      <div class="w-full">
        <Field label="Url">
          <Input bind:value={requestUrl} />
        </Field>
      </div>
    </div>
    {#if selectedMethod.value !== 'GET'}
      <div class="w-full flex flex-col gap-1">
        <Label id="request-body-label" for="request-body">Request</Label>
        <textarea
          id="request-body"
          aria-labelledby="request-body-label"
          bind:value={requestBody}
          rows={8}
          class="border border-subtle p-2 bg-subtle rounded-2xl"
        ></textarea>
      </div>
    {/if}
  </div>

  <div>
    <Button color="secondary" fullWidth onclick={handleSend}>Execute</Button>
  </div>

  {#if response}
    <div class="flex flex-col gap-2">
      <Label>Response - <Code class="p-1" color={response.ok ? 'success' : 'danger'}>{response.status}</Code></Label>
      <CodeBlock language={json} code={response.body} />
    </div>
  {/if}
{:else}
  <Stack gap={4}>
    <Text color="muted">Connect to a demo server, or your own, to try this endpoint.</Text>
    <div class="w-full lg:w-1/2">
      <Button size="small" color="secondary" onclick={() => playgroundManager.configure()}>Connect</Button>
    </div>
  </Stack>
{/if}
