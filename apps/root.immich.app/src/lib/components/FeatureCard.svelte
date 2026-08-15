<script lang="ts">
  import type { Feature } from '$lib/types';
  import { Button, Heading, Icon, Link, Text } from '@immich/ui';
  import { tv } from 'tailwind-variants';

  type Props = {
    feature: Feature;
    color?: 'primary' | 'secondary';
  };

  const { feature, color = 'secondary' }: Props = $props();
  const { title, description, icons, links } = $derived(feature);

  const styles = tv({
    base: 'flex flex-col justify-between rounded-2xl border-2 p-6 transition-all',
    variants: {
      color: {
        primary: 'border border-primary-300 bg-primary-50',
        secondary: 'bg-light-50',
      },
    },
  });
</script>

<div class={styles({ color })}>
  <div>
    <div class="mb-6 flex gap-2">
      {#each icons as icon, i (i)}
        {#if icon}
          {#if typeof icon === 'object' && 'href' in icon && icon.href}
            <Link href={icon.href}>
              <Icon {icon} size="2em" />
            </Link>
          {:else}
            <Icon {icon} size="2em" />
          {/if}
        {/if}
      {/each}
    </div>
    <Heading size="medium">{title}</Heading>
    <Text color="muted" class="mt-2">{description}</Text>
  </div>
  {#if links && links.length > 0}
    <div class="mt-4">
      {#each links as link, i (i)}
        <Button size="small" {color} href={link.href}>{link.text}</Button>
      {/each}
    </div>
  {/if}
</div>
