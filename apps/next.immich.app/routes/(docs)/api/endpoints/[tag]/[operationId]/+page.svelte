<script lang="ts">
  import ApiAdminRouteBadge from '$lib/components/ApiAdminRouteBadge.svelte';
  import ApiDeprecatedBadge from '$lib/components/ApiDeprecatedBadge.svelte';
  import ApiPermission from '$lib/components/ApiPermission.svelte';
  import ApiPublicRouteBadge from '$lib/components/ApiPublicRouteBadge.svelte';
  import ApiSchema from '$lib/components/ApiSchema.svelte';
  import ApiSharedLinkRouteBadge from '$lib/components/ApiSharedLinkRouteBadge.svelte';
  import LinkableHeading from '$lib/components/LinkableHeading.svelte';
  import { getEndpointColor, getOpenApi, isRef } from '$lib/services/open-api';
  import { Card, CardBody, Code, Heading, Stack, Text } from '@immich/ui';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const endpoint = $derived(data.endpoint);

  const { fromRef } = getOpenApi();
</script>

<Stack gap={8}>
  <section>
    <div class="flex flex-col gap-2">
      <Heading size="large" tag="h1">
        <span class="group flex items-center gap-1 {endpoint.deprecated ? 'text-gray-500 italic' : ''}">
          <span class="flex gap-2">
            <span class={getEndpointColor(endpoint)}>{endpoint.method}</span>
            <span>{endpoint.route}</span>
          </span>
        </span>
      </Heading>
      {#if endpoint.description}
        <Text color="muted" fontWeight="bold">{endpoint.description}</Text>
      {/if}
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
          <ApiAdminRouteBadge />
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
    <hr class="mt-4 border border-subtle" />
  </section>

  {#if endpoint.queryParams.length > 0}
    <section class="flex flex-col gap-2">
      <LinkableHeading tag="h2" href="#query-parameters">Query Parameters</LinkableHeading>
      <Card color="secondary">
        <CardBody>
          <div class="grid grid-cols-12 py-2 px-4 font-bold">
            <div class="col-span-3">Param</div>
            <div class="col-span-3">Type</div>
            <div class="col-span-3">Required</div>
            <div class="col-span-3">Description</div>
          </div>
          <hr class="border-b border" />
          <div class="grid grid-cols-12 py-2 px-4">
            {#each endpoint.queryParams as param, i (i)}
              <div class="col-span-3">
                <Code>{param.name}</Code>
              </div>
              <div class="col-span-3">
                <!-- <Code>{param.schema.format ?? param.schema.type}</Code> -->
              </div>
              <div class="col-span-3">
                <Code>{param.required}</Code>
              </div>
              <div class="col-span-3">
                <Text>{param.description}</Text>
              </div>
            {/each}
          </div>
        </CardBody>
      </Card>
    </section>
  {/if}

  {#if endpoint.responses.length > 0}
    <section class="flex flex-col gap-2">
      {#if endpoint.responses.length === 1 && isRef(endpoint.responses[0].schema)}
        <!-- {@const response = endpoint.responses[0]} -->
        <!-- {@const ref = response.schema as ReferenceObject} -->
        <!-- {@const schema = fromRef(ref) as SchemaObject} -->
        <Heading tag="h2">Response</Heading>
        <ApiSchema schema={fromRef(endpoint.responses[0].schema)} />
      {:else}
        <Heading tag="h2">Responses</Heading>
        <div class="px-4 flex gap-1">
          {#each endpoint.responses as response, i (i)}
            <span>{response.status}</span>
            {#if response.status === 204 || !response.contentType}
              - No content
            {/if}
            {#if response.schema}
              - <ApiSchema schema={response.schema} />
            {/if}
            <!-- <span>{response.status}</span>
                {#if response.contentType}
                  <span>-</span>
                  <span class="">{response.contentType}</span>
                {/if} -->
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</Stack>
