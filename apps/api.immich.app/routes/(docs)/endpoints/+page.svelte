<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import ApiTagSummary from '$lib/api/components/ApiTagSummary.svelte';
  import { getOpenApi } from '$lib/api/services/open-api';

  const { tags } = getOpenApi();
</script>

<ApiPageContent title="API Endpoints" description="An overview of all the available API endpoints">
  {#each tags as tag (tag.href)}
    <ApiTagSummary {tag} />
  {/each}
</ApiPageContent>
