<script lang="ts">
  import ApiNextStepCard from '$lib/api/components/ApiNextStepCard.svelte';
  import { Heading, Stack } from '@immich/ui';

  type Props = {
    nextSteps: Array<{ href: string; title: string }>;
  };

  const { nextSteps }: Props = $props();
</script>

<Stack gap={4}>
  <Heading>Next Steps</Heading>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {#each nextSteps as nextStep (nextStep.title)}
      <ApiNextStepCard {...nextStep} />
    {/each}
  </div>
</Stack>
