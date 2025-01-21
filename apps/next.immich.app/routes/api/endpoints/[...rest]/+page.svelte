<script lang="ts">
  import '$lib/app.css';
  import ApiSchema from '$lib/components/ApiSchema.svelte';
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api';
  import { getOpenApi, getRefHref, getRefName, isRef, type ApiMethod } from '$lib/services/open-api.svelte';
  import { Code, Heading, Link, Text } from '@immich/ui';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const tag = $derived(data.tag);

  const methodColor: Partial<Record<ApiMethod, string>> = {
    GET: 'text-success',
    POST: 'text-info',
    PUT: 'text-warning',
    DELETE: 'text-danger',
  };

  const { fromRef } = getOpenApi();
</script>

<Heading size="large" class="mb-6">{tag.name}</Heading>

<div class="flex flex-col max-w-screen-lg">
  {#each tag.endpoints as endpoint, i}
    {#if i > 0}
      <hr class="my-8" />
    {/if}
    <a href="#{endpoint.operationId}" id={endpoint.operationId}>
      <Heading size="medium">
        <span class="group flex gap-2 items-center justify-between">
          <span class="flex gap-2">
            <span class={methodColor[endpoint.method] ?? ''}>{endpoint.method}</span>
            <span>{endpoint.route}</span>
          </span>
          <span class="hover:underline text-muted">#{endpoint.operationId}</span>
        </span>
      </Heading>
    </a>
    {#if endpoint.summary}
      <Text color="muted">{endpoint.summary}</Text>
    {/if}
    {#if endpoint.description}
      <Text color="muted">{endpoint.description}</Text>
    {/if}

    <!-- <Stack gap={2}>
        <Heading size="tiny">Authentication</Heading>
        <section class="flex gap-1">
          {#each endpoint.authentication as auth}
            <Text class="px-2 y-1 rounded-full bg-primary text-light">{auth}</Text>
          {/each}
        </section>
      </Stack> -->

    <!-- <code>{JSON.stringify(endpoint)}</code> -->
    {#if endpoint.params.length > 0}
      <Heading size="tiny" class="my-2">Request Params</Heading>
      <div class="bg-subtle rounded-xl text-sm">
        <div class="grid grid-cols-12 py-2 px-4 font-bold">
          <div class="col-span-3">Param</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2">Required</div>
          <div class="col-span-5">Description</div>
        </div>
        <hr />
        <div class="grid grid-cols-12 py-2 px-4">
          {#each endpoint.params as param}
            <div class="col-span-3">
              <Code>{param.name}</Code>
            </div>
            <div class="col-span-2">
              <ApiSchema schema={param.schema} />
            </div>
            <div class="col-span-2">
              <Code>{param.required}</Code>
            </div>
            <div class="col-span-5">
              <Text>{param.description}</Text>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if endpoint.requestBody}
      <Heading size="tiny" class="my-2 flex gap-2 items-center">
        <span>Request Body</span>
        <Text color="muted" size="small">
          (<Link href={getRefHref(endpoint.requestBody)}>
            {getRefName(endpoint.requestBody)}
          </Link>)
        </Text>
      </Heading>
      <!-- <ApiSchema schema={schemasMap(endpoint.requestBody)} /> -->
    {/if}

    {#if endpoint.queryParams.length > 0}
      <Heading size="tiny" class="my-2">Query Parameters</Heading>
      <div class="bg-subtle rounded-xl text-sm">
        <div class="grid grid-cols-12 py-2 px-4 font-bold">
          <div class="col-span-3">Param</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2">Required</div>
          <div class="col-span-5">Description</div>
        </div>
        <hr class="border-b border" />
        <div class="grid grid-cols-12 py-2 px-4">
          {#each endpoint.queryParams as param}
            <div class="col-span-3">
              <Code>{param.name}</Code>
            </div>
            <div class="col-span-2">
              <!-- <Code>{param.schema.format ?? param.schema.type}</Code> -->
            </div>
            <div class="col-span-2">
              <Code>{param.required}</Code>
            </div>
            <div class="col-span-5">
              <Text>{param.description}</Text>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if endpoint.responses.length > 0}
      {#if endpoint.responses.length === 1 && isRef(endpoint.responses[0].schema)}
        {@const response = endpoint.responses[0]}
        {@const ref = response.schema as ReferenceObject}
        {@const schema = fromRef(ref) as SchemaObject}
        <Heading size="tiny" class="my-2 flex gap-2 items-center">
          <span>Response</span>
          <Text color="muted" size="small">
            (<Link href={getRefHref(ref)}>
              {schema?.title}
            </Link>)
          </Text>
        </Heading>
        <ApiSchema schema={fromRef(endpoint.responses[0].schema)} />
      {:else}
        <Heading size="tiny" class="my-2">Response</Heading>
        <div class="px-4 flex gap-1">
          {#each endpoint.responses as response}
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
    {/if}
  {/each}
</div>
