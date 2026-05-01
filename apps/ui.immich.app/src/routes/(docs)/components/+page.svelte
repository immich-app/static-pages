<script lang="ts">
  import ComponentCard from '$lib/components/ComponentCard.svelte';
  import Grid from '$lib/components/Grid.svelte';
  import MarkdownPage from '$lib/components/MarkdownPage.svelte';
  import { components } from '$lib/constants.js';
</script>

<MarkdownPage attributes={{ title: 'Components', description: 'A list of all the Immich UI components' }} size="large">
  <Grid>
    {#each components as component (component.name)}
      <ComponentCard {component} />
    {/each}
  </Grid>
</MarkdownPage>
