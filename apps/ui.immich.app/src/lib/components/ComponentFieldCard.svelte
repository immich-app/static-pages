<script lang="ts">
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentTipCard from '$lib/components/ComponentTipCard.svelte';
  import { Text } from '@immich/ui';
</script>

<ComponentTipCard>
  <Text>
    This component can be used with the <ComponentLink name="Field" /> component to build forms
  </Text>
</ComponentTipCard>
