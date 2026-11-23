<script lang="ts">
  import ComponentExamples from '#lib/components/ComponentExamples.svelte';
  import ComponentPage from '#lib/components/ComponentPage.svelte';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import ColorExample from './ColorExample.svelte';
  import colorExample from './ColorExample.svelte?raw';
  import CustomClassExample from './CustomClassExample.svelte';
  import customClassExample from './CustomClassExample.svelte?raw';
  import DisabledExample from './DisabledExample.svelte';
  import disabledExample from './DisabledExample.svelte?raw';
  import EditorModeExample from './EditorModeExample.svelte';
  import editorModeExample from './EditorModeExample.svelte?raw';
  import FullWidthExample from './FullWidthExample.svelte';
  import fullWidthExample from './FullWidthExample.svelte?raw';
  import IconExample from './IconExample.svelte';
  import iconExample from './IconExample.svelte?raw';
  import NoSelectionExample from './NoSelectionExample.svelte';
  import noSelectionExample from './NoSelectionExample.svelte?raw';
  import ShapeExample from './ShapeExample.svelte';
  import shapeExample from './ShapeExample.svelte?raw';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
  import VariantExample from './VariantExample.svelte';
  import variantExample from './VariantExample.svelte?raw';
</script>

<ComponentPage name="ButtonGroup" description="A row of buttons where exactly one option is selected">
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Size', code: sizeExample, component: SizeExample },
      { title: 'Color', code: colorExample, component: ColorExample },
      { title: 'Variant', code: variantExample, component: VariantExample },
      { title: 'Shape', code: shapeExample, component: ShapeExample },
      { title: 'Icon', code: iconExample, component: IconExample },
      { title: 'Disabled', code: disabledExample, component: DisabledExample },
      { title: 'Full width', code: fullWidthExample, component: FullWidthExample },
      { title: 'No selection', code: noSelectionExample, component: NoSelectionExample },
      { title: 'Custom class', code: customClassExample, component: CustomClassExample },
      { title: 'Editor mode', code: editorModeExample, component: EditorModeExample },
    ]}
  />
</ComponentPage>
