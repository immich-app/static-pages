<script lang="ts">
  import { Button } from '@immich/ui';

  type Prop = {
    href: string;
    title: string;
  };

  const { href, title }: Prop = $props();
</script>

<Button {href} size="giant" fullWidth color="secondary" variant="outline" class="px-4 py-8">{title}</Button>
