<script lang="ts">
  import '#lib/app.css';
  import { Badge, Heading, Text, ThemeSwitcher, TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types.js';

  type Props = {
    data: LayoutData;
    children?: Snippet;
  };

  let { data, children }: Props = $props();
</script>

<TooltipProvider>
  <header class="flex items-center justify-between gap-4 border-b px-4 py-2 sm:px-8">
    <Heading size="small" tag="h1">Immich Visual</Heading>
    <div class="flex items-center gap-3">
      <Text size="small">{data.user.name}</Text>
      <Badge size="small">{data.user.role}</Badge>
      <ThemeSwitcher />
    </div>
  </header>
  {@render children?.()}
</TooltipProvider>
