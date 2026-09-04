<script lang="ts">
  import { PageFooterNavigation, Text } from '@immich/ui';
</script>

<Text>Both links are optional, so the first and last page of a section only render the direction that exists.</Text>

<PageFooterNavigation
  previous={{ title: 'Installation', href: '#installation' }}
  next={{ title: 'Configuration', href: '#configuration' }}
/>

<PageFooterNavigation next={{ title: 'Getting started', href: '#getting-started' }} />
