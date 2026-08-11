<script lang="ts">
  import { Button, Heading, Icon, Text, type IconLike } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    children?: Snippet;
    icon: IconLike;
    href: string;
    text: string;
  };

  const { title, icon, href, text, children }: Props = $props();
</script>

<div
  class="group flex flex-col items-start gap-6 rounded-3xl border border-primary-300 bg-primary-50 p-10 transition-colors hover:border-primary-400 sm:flex-row sm:items-center sm:gap-8"
>
  <Icon
    {icon}
    size="4rem"
    class="shrink-0 rotate-[-25deg] text-primary transition-transform duration-200 ease-out group-hover:scale-105 group-hover:rotate-[-10deg]"
  />

  <div class="flex flex-1 flex-col gap-1.5 px-2">
    <Heading size="medium" tag="h3">{title}</Heading>
    <Text color="muted">{@render children?.()}</Text>
  </div>

  <Button {href} size="large" shape="round" trailingIcon={mdiOpenInNew} class="shrink-0">
    {text}
  </Button>
</div>
