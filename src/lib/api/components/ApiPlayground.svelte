<script lang="ts">
  import { type ApiEndpoint } from '$lib/api/services/open-api';
  import { playgroundManager } from '$lib/api/services/playground-manager.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import {
    Button,
    Code,
    Field,
    Heading,
    Icon,
    IconButton,
    Input,
    Label,
    Select,
    Stack,
    Text,
    Textarea,
  } from '@immich/ui';
  import { mdiCog, mdiLightningBolt } from '@mdi/js';
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

<section class="flex flex-col gap-2">
  <div class="flex justify-between place-items-center gap-2">
    <Heading size="small" tag="h2" class="flex items-center gap-1">
      Live Response
      <Icon icon={mdiLightningBolt} size="1.5rem" class="text-yellow-600 dark:text-yellow-400" />
    </Heading>
    <IconButton
      onclick={() => playgroundManager.configure()}
      color="secondary"
      variant="outline"
      icon={mdiCog}
      aria-label="Edit"
    />
  </div>

  {#if playgroundManager.connected}
    <div class="flex flex-col gap-4">
      <div class="flex gap-2 place-items-center">
        <div class="max-w-64">
          <Field label="Method">
            <Select bind:value={selectedMethod} data={httpMethods} />
          </Field>
        </div>
        <Field label="Url">
          <Input bind:value={requestUrl} />
        </Field>
      </div>
      {#if selectedMethod.value !== 'GET'}
        <Field label="Request">
          <Textarea id="request-body" aria-labelledby="request-body-label" bind:value={requestBody} rows={8} grow />
        </Field>
      {/if}
    </div>

    <div class="flex gap-2">
      <Button color="secondary" fullWidth onclick={handleSend}>Execute</Button>
    </div>

    {#if response}
      <div class="flex flex-col gap-2">
        <Label>
          Response - <Code color={response.ok ? 'success' : 'danger'} variant="outline">{response.status}</Code>
        </Label>
        <CodeBlock language={json} code={response.body} />
      </div>
    {/if}

    <div class="w-full lg:w-1/2"></div>
  {:else}
    <Stack gap={4}>
      <Text color="muted">Connect to a demo server, or your own, to try this endpoint.</Text>
      <div class="w-full lg:w-1/2">
        <Button size="small" color="secondary" onclick={() => playgroundManager.configure()}>Connect</Button>
      </div>
    </Stack>
  {/if}
</section>
