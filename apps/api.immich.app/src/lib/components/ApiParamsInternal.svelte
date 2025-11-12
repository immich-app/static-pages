<script lang="ts">
  import ApiHistoryModal from '$lib/components/ApiHistoryModal.svelte';
  import ApiSchemaType from '$lib/components/ApiSchemaType.svelte';
  import ApiState from '$lib/components/ApiState.svelte';
  import type { HistoryItem, ReferenceObject, SchemaObject, State } from '$lib/services/open-api.d';
  import { Card, CardBody, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiHistory } from '@mdi/js/mdi';

  type InternalParam = {
    name: string;
    description?: string;
    type?: SchemaObject | ReferenceObject;
    required?: boolean;
    state?: State;
    history?: HistoryItem[];
  };

  type Props = {
    params: InternalParam[];
  };

  const handleViewHistory = async (name: string, history: HistoryItem[]) => {
    await modalManager.show(ApiHistoryModal, { name, history });
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
      <div class="col-span-2">Status</div>
      <div class="col-span-4">Description</div>
    </div>
    {#each params as param, i (i)}
      <div class="grid grid-cols-12 px-4 py-2">
        <div class="col-span-3">
          <code>{param.name}</code>
          {#if param.required}
            <span class="text-danger">*</span>
          {/if}
        </div>
        <div class="col-span-3">
          {#if param.type}
            <ApiSchemaType schema={param.type} />
          {/if}
        </div>
        <div class="col-span-2 flex items-center gap-1">
          {#if param.state}
            <div>
              <ApiState state={param.state} short />
            </div>
          {/if}

          {#if param.history}
            <div>
              <IconButton
                icon={mdiHistory}
                aria-label="View history"
                size="small"
                color="secondary"
                variant="ghost"
                onclick={() => handleViewHistory(param.name, param.history!)}
              />
            </div>
          {/if}
        </div>
        <div class="col-span-4">{param.description}</div>
      </div>
    {/each}
  </Card>
</div>
