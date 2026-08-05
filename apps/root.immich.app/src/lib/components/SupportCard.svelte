<script lang="ts">
  import { Button, Heading, type IconLike } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    children?: Snippet;
    icon?: IconLike;
    href: string;
    text: string;
  };

  const { title, icon, href, text, children }: Props = $props();
</script>

<div class="flex flex-col justify-between gap-2 rounded-xl border bg-light-50 p-4">
  <div>
    <Heading size="small" class="mb-4">{title}</Heading>
    {@render children?.()}
  </div>

  <div>
    <Button
      fullWidth
      leadingIcon={icon}
      size="small"
      {href}
      trailingIcon={mdiOpenInNew}
      color="primary"
      class="mt-2 inline-flex"
    >
      {text}
    </Button>
  </div>
</div>
