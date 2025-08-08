<script lang="ts">
  import ApiAdminRouteBadge from '$lib/api/components/ApiAdminRouteBadge.svelte';
  import ApiDeprecatedBadge from '$lib/api/components/ApiDeprecatedBadge.svelte';
  import ApiPermission from '$lib/api/components/ApiPermission.svelte';
  import ApiPublicRouteBadge from '$lib/api/components/ApiPublicRouteBadge.svelte';
  import ApiSchema from '$lib/api/components/ApiSchema.svelte';
  import ApiSchemaRef from '$lib/api/components/ApiSchemaRef.svelte';
  import ApiSharedLinkRouteBadge from '$lib/api/components/ApiSharedLinkRouteBadge.svelte';
  import { getEndpointColor, getOpenApi, isRef } from '$lib/api/services/open-api';
  import LinkableHeading from '$lib/components/LinkableHeading.svelte';
  import { Button, Card, CardBody, Code, Heading, Icon, Stack, Text } from '@immich/ui';
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
      <Heading size="large" tag="h1" class="flex justify-between items-center">
        <span class="group flex items-center gap-1 {endpoint.deprecated ? 'text-gray-500 italic' : ''}">
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
                {#if param.schema}
                  {#if isRef(param.schema)}
                    <ApiSchemaRef ref={param.schema} />
                  {:else}
                    <Code>{param.schema.format ?? param.schema.type}</Code>
                  {/if}
                {/if}
              </div>
              <div class="col-span-3">
                {#if param.required}
                  <span
                    class="py-1 px-2 dark:bg-red-900 dark:text-red-50 bg-red-200 text-muted rounded-lg"
                    title="Param is required">Required</span
                  >
                {/if}
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

  <Stack gap={4}>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div class="w-full flex flex-col place-items-end">
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
