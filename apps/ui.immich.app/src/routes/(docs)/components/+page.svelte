<script lang="ts">
  import ComponentCard from '$lib/components/ComponentCard.svelte';
  import Grid from '$lib/components/Grid.svelte';
  import { components } from '$lib/constants.js';
  import { Markdown } from '@immich/ui';
</script>

<Markdown.Page attributes={{ title: 'Components', description: 'A list of all the Immich UI components' }} size="large">
  <Grid>
    {#each components as component (component.name)}
      <ComponentCard {component} />
    {/each}
  </Grid>
</Markdown.Page>
