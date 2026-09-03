<script lang="ts">
  import Closable from '$lib/components/Closable.svelte';
  import { Badge, Stack, Text } from '@immich/ui';
  import { mdiLightbulb, mdiLightningBolt } from '@mdi/js';
</script>

<Stack gap={4}>
  <div>
    <Text fontWeight="medium" class="mb-2">Leading</Text>
    <Badge leadingIcon={mdiLightbulb}>Slow</Badge>
  </div>

  <div>
    <Text fontWeight="medium" class="mb-2">Trailing</Text>
    <Badge trailingIcon={mdiLightningBolt}>Fast</Badge>
  </div>

  <div>
    <Text fontWeight="medium" class="mb-2">Leading & Trailing</Text>
    <Badge leadingIcon={mdiLightbulb} trailingIcon={mdiLightningBolt}>Super-Fast</Badge>
  </div>

  <div>
    <Text fontWeight="medium" class="mb-2">Closable</Text>
    <Closable>
      {#snippet child({ onClose })}
        <Badge leadingIcon={mdiLightningBolt} trailingIcon={mdiLightbulb} {onClose}>Super-Fast</Badge>
      {/snippet}
    </Closable>
  </div>
</Stack>
