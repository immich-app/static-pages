<script lang="ts">
  import type { ApiParam } from '$lib/services/open-api';
  import ApiParamsInternal from './ApiParamsInternal.svelte';

  type Props = {
    params: ApiParam[];
  };

  const { params: parameters }: Props = $props();

  let params = $derived(
    parameters.map((param) => ({
      name: param.name,
      description: param.description,
      type: param.schema,
      required: param.required,
      state: param.state,
      history: param.history,
    })),
  );
</script>

<ApiParamsInternal {params} />
