<script lang="ts">
  import ComponentSizes from '#lib/components/ComponentSizes.svelte';
  import { FutoLogo, Text } from '@immich/ui';
</script>

<ComponentSizes>
  {#snippet child({ size, label })}
    <Text class="mb-1" fontWeight="bold">{label}</Text>
    <FutoLogo {size} />
  {/snippet}
</ComponentSizes>
