<script lang="ts">
  import ApiSchemaType from '$lib/components/ApiSchemaType.svelte';
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api.d';
  import { Card, CardBody, Text } from '@immich/ui';

  type InternalParam = {
    name: string;
    description?: string;
    type?: SchemaObject | ReferenceObject;
    required?: boolean;
  };

  type Props = {
    params: InternalParam[];
  };

  const { params }: Props = $props();
</script>

<div class="flex flex-col gap-2 lg:hidden">
  {#each params as param, i (i)}
    <Card color="secondary">
      <CardBody class="flex flex-col gap-2 py-2">
        <div class="flex gap-2">
          <div class="flex w-full place-items-center justify-between">
            <Text>
              <code>{param.name} </code>
              {#if param.required}
                <span class="text-danger">*</span>
              {/if}
            </Text>
            {#if param.type}
              <ApiSchemaType schema={param.type} />
            {/if}
          </div>
        </div>
        {#if param.description}
          <Text color="muted" class="whitespace-pre-wrap">{param.description}</Text>
        {/if}
      </CardBody>
    </Card>
  {/each}
</div>

<div class="hidden lg:block">
  <Card color="secondary">
    <div class="bg-subtle text-dark mb-2 grid grid-cols-12 border-b px-4 py-2 font-bold">
      <div class="col-span-3">Property</div>
      <div class="col-span-3">Type</div>
      <div class="col-span-3">Required</div>
      <div class="col-span-3">Description</div>
    </div>
    {#each params as param, i (i)}
      <div class="grid grid-cols-12 px-4 py-2">
        <div class="col-span-3">
          <code>{param.name}</code>
        </div>
        <div class="col-span-3">
          {#if param.type}
            <ApiSchemaType schema={param.type} />
          {/if}
        </div>
        <div class="col-span-3">
          {#if param.required}
            <span class="rounded-lg bg-red-200 px-2 py-1 dark:bg-red-900 dark:text-red-50" title="Param is required"
              >Required</span
            >
          {/if}
        </div>
        <div class="col-span-3">{param.description}</div>
      </div>
    {/each}
  </Card>
</div>
