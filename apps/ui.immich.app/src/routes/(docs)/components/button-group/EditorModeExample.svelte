<script lang="ts">
  import { ButtonGroup, Code, VStack } from '@immich/ui';
  import { mdiCodeJson, mdiFormatListBulletedSquare } from '@mdi/js';

  let mode = $state<'visual' | 'json'>('visual');
</script>

<VStack gap={4} class="items-start">
  <ButtonGroup
    size="small"
    shape="round"
    aria-label="Editor mode"
    items={[
      { value: 'visual', label: 'Visual', icon: mdiFormatListBulletedSquare },
      { value: 'json', label: 'JSON', icon: mdiCodeJson },
    ]}
    bind:value={mode}
  />
  {#if mode === 'visual'}
    <p>Visual editor</p>
  {:else}
    <Code>{'{ "trigger": "AssetCreate" }'}</Code>
  {/if}
</VStack>
