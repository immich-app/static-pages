<script lang="ts">
  import type { ParameterObject } from '$lib/api/services/open-api.d';
  import ApiParamsInternal from './ApiParamsInternal.svelte';

  type Props = {
    params: ParameterObject[];
  };

  const { params: parameters }: Props = $props();

  let params = $derived(
    parameters.map((param) => ({
      name: param.name,
      description: param.description,
      type: param.schema,
      required: param.required,
    })),
  );
</script>

<ApiParamsInternal {params} />
