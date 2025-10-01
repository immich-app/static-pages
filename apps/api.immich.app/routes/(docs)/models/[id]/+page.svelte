<script lang="ts">
  import ApiSchema from '$lib/api/components/ApiSchema.svelte';
  import type { ApiModel } from '$lib/api/services/open-api';
  import { Code, Heading } from '@immich/ui';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const model = $derived(data.model);

  const getType = (model: ApiModel) => {
    if (model.enum) {
      return 'Enum';
    }

    return model.format ?? model.type ?? 'Unknown';
  };

  const type = $derived(getType(model));
</script>

<Heading size="large" class="mb-2" tag="h1">
  <a href="#{model.name}" id={model.name} class="scroll-m-8 flex gap-2">
    <span>{model.name}</span>
  </a>
</Heading>

<div class="mb-4">
  <Code color="muted">{type}</Code>
</div>

<ApiSchema schema={model} />
