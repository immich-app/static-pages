<script lang="ts">
  import { typeToLabel, type BlogType } from '$lib';
  import { Routes } from '$lib/route';
  import { Badge, type Size } from '@immich/ui';

  type Props = {
    type: BlogType;
    size?: Size;
    class?: string;
  };

  const { type, size, class: className }: Props = $props();
</script>

<div class={className}>
  <a href={Routes.blog({ type })}>
    <Badge {size}>{typeToLabel(type)}</Badge>
  </a>
</div>
