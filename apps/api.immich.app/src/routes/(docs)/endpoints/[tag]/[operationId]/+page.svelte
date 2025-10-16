<script lang="ts">
  import LinkableHeading from '$common/components/LinkableHeading.svelte';
  import ApiAdminRouteBadge from '$lib/components/ApiAdminRouteBadge.svelte';
  import ApiDeprecatedBadge from '$lib/components/ApiDeprecatedBadge.svelte';
  import ApiParams from '$lib/components/ApiParams.svelte';
  import ApiPermission from '$lib/components/ApiPermission.svelte';
  import ApiPlayground from '$lib/components/ApiPlayground.svelte';
  import ApiPublicRouteBadge from '$lib/components/ApiPublicRouteBadge.svelte';
  import ApiSchema from '$lib/components/ApiSchema.svelte';
  import ApiSharedLinkRouteBadge from '$lib/components/ApiSharedLinkRouteBadge.svelte';
  import { getEndpointColor, getOpenApi, isRef } from '$lib/services/open-api';
  import { Button, Heading, Icon, Stack, Text } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight } from '@mdi/js';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const endpoint = $derived(data.endpoint);
  const tag = $derived(data.tag);

  const { fromRef } = getOpenApi();
</script>

<Stack gap={8}>
  <section>
    <div class="flex flex-col gap-2">
      <Heading size="large" tag="h1" class="flex flex-col md:flex-row md:items-center md:justify-between">
        <span class="group flex items-center gap-1 {endpoint.deprecated ? 'italic text-gray-500' : ''}">
          <span class="flex gap-2">
            <span class={getEndpointColor(endpoint)}>{endpoint.method}</span>
            <span>{endpoint.route}</span>
          </span>
        </span>
        <Text color="muted">{endpoint.operationId}</Text>
      </Heading>
      {#if endpoint.description}
        <Text color="muted" fontWeight="bold">{endpoint.description}</Text>
      {/if}
      <div class="flex flex-col justify-between gap-4 lg:flex-row">
        <div>
          {#if endpoint.deprecated}
            <span>
              <ApiDeprecatedBadge />
            </span>
          {/if}

          {#if endpoint.adminRoute}
            <ApiAdminRouteBadge />
          {/if}

          {#if endpoint.sharedLinkRoute}
            <ApiSharedLinkRouteBadge />
          {/if}

          {#if endpoint.publicRoute}
            <ApiPublicRouteBadge />
          {/if}

          {#if endpoint.permission}
            <ApiPermission value={endpoint.permission} />
          {/if}
        </div>
      </div>
    </div>
    <hr class="border-subtle mt-4 border" />
  </section>

  {#if endpoint.params.length > 0}
    <section class="flex flex-col gap-2">
      <LinkableHeading tag="h2" id="parameters" size="small">Parameters</LinkableHeading>
      <ApiParams params={endpoint.params} />
    </section>
  {/if}

  {#if endpoint.queryParams.length > 0}
    <section class="flex flex-col gap-2">
      <LinkableHeading tag="h2" id="query-parameters" size="small">Query Parameters</LinkableHeading>
      <ApiParams params={endpoint.queryParams} />
    </section>
  {/if}

  {#if endpoint.requestBody}
    <section class="flex flex-col gap-2">
      <Heading tag="h2" size="small">Request</Heading>
      <ApiSchema schema={fromRef(endpoint.requestBody)} />
    </section>
  {/if}

  {#if endpoint.responses.length > 0}
    <section class="flex flex-col gap-2">
      {#if endpoint.responses.length === 1 && isRef(endpoint.responses[0].schema)}
        <Heading tag="h2" size="small">Response</Heading>
        <ApiSchema schema={fromRef(endpoint.responses[0].schema)} />
      {:else}
        <Heading tag="h2" size="small">Responses</Heading>
        <div class="flex gap-1 px-4">
          {#each endpoint.responses as response, i (i)}
            <span>{response.status}</span>
            {#if response.status === 204 || !response.contentType}
              - No content
            {/if}
            {#if response.schema}
              - <ApiSchema schema={response.schema} />
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <ApiPlayground {endpoint} />

  <Stack gap={4}>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {#if endpoint.previous}
        <Button href={endpoint.previous.href} size="giant" fullWidth color="secondary" variant="outline">
          <Stack gap={2} class="w-full">
            <Text size="small">Previous</Text>
            <div class="flex items-center gap-2">
              <Icon icon={mdiArrowLeft} />
              <Text>{tag.name}.{endpoint.previous.operationId}</Text>
            </div>
          </Stack>
        </Button>
      {:else}
        <span></span>
      {/if}

      {#if endpoint.next}
        <Button href={endpoint.next.href} size="giant" fullWidth color="secondary" variant="outline">
          <div class="flex w-full flex-col place-items-end">
            <Text size="small">Next</Text>
            <div class="flex items-center gap-2">
              <Text>{tag.name}.{endpoint.next.operationId}</Text>
              <Icon icon={mdiArrowRight} />
            </div>
          </div>
        </Button>
      {:else}
        <span></span>
      {/if}
    </div>
  </Stack>
</Stack>
