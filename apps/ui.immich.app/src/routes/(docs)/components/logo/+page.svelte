<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Button, logoManager } from '@immich/ui';
  import FutoExample from './FutoExample.svelte';
  import futoExample from './FutoExample.svelte?raw';
  import IconExample from './IconExample.svelte';
  import iconExample from './IconExample.svelte?raw';
  import InlineExample from './InlineExample.svelte';
  import inlineExample from './InlineExample.svelte?raw';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
  import StackedExample from './StackedExample.svelte';
  import stackedExample from './StackedExample.svelte?raw';

  let logoType = $state('immich');

  function toggle() {
    if (logoType === 'immich') {
      logoManager.setLogo({
        stacked: {
          light: 'https://placehold.co/400x200?text=Stacked+Light',
          dark: 'https://placehold.co/400x200?text=Stacked+Dark',
        },
        unstacked: {
          light: 'https://placehold.co/400x100?text=Inline+Light',
          dark: 'https://placehold.co/400x100?text=Inline+Dark',
        },
        stacked_futo: {
          light: 'https://placehold.co/400x300?text=FUTO+Light',
          dark: 'https://placehold.co/400x300?text=FUTO+Dark',
        },
        icon: 'https://placehold.co/100x100?text=Icon',
      });
      logoType = 'custom';
    } else {
      logoManager.resetLogos();
      logoType = 'immich';
    }
  }
</script>

<ComponentPage name="Logo" description="A component for displaying various versions of the Immich logo">
  <Button onclick={toggle}>Toggle Custom Logos</Button>

  <ComponentExamples
    examples={[
      { title: 'Size', code: sizeExample, component: SizeExample },
      { title: 'Icon', code: iconExample, component: IconExample },
      { title: 'Inline', code: inlineExample, component: InlineExample },
      { title: 'Stacked', code: stackedExample, component: StackedExample },
      { title: 'FUTO', code: futoExample, component: FutoExample },
    ]}
  />
</ComponentPage>
