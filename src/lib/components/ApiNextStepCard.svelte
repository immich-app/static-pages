<script lang="ts">
  import { Button } from '@immich/ui';

  type Prop = {
    href: string;
    title: string;
  };

  const { href, title }: Prop = $props();
</script>

<a {href}>
  <Button size="giant" fullWidth color="secondary" variant="outline" class="px-4 py-8">{title}</Button>
</a>
