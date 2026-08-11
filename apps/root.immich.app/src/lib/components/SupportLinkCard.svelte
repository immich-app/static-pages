<script lang="ts">
  import { Button, Heading, Icon, type IconLike } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import { tv } from 'tailwind-variants';

  type Props = {
    title: string;
    icon: IconLike;
    buttonIcon?: IconLike;
    href: string;
    text: string;
    color?: 'primary' | 'warning' | 'info';
  };

  const { title, icon, buttonIcon, href, text, color = 'primary' }: Props = $props();

  const iconStyles = tv({
    base: 'shrink-0',
    variants: {
      color: {
        primary: 'text-primary',
        warning: 'text-warning',
        info: 'text-info',
      },
    },
  });

  const buttonStyles = tv({
    base: 'shrink-0',
    variants: {
      color: {
        primary: 'hover:border-primary hover:text-primary',
        warning: 'hover:border-warning hover:text-warning',
        info: 'hover:border-info hover:text-info',
      },
    },
  });
</script>

<div class="flex items-center gap-4 rounded-2xl border bg-light-50 p-6">
  <Icon {icon} size="1.75rem" class={iconStyles({ color })} />

  <Heading size="small" tag="h3" class="flex-1">{title}</Heading>

  <Button
    {href}
    size="small"
    shape="round"
    variant="outline"
    color="secondary"
    leadingIcon={buttonIcon}
    trailingIcon={mdiOpenInNew}
    class={buttonStyles({ color })}
  >
    {text}
  </Button>
</div>
