<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Checkbox, HStack, Stack, Text } from '@immich/ui';
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ color, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <HStack>
          <Checkbox {color} checked />
          <Checkbox {color} />
          <Checkbox {color} indeterminate />
        </HStack>
      </div>
    {/snippet}
  </ComponentColors>
</Stack>
