<script lang="ts">
  import { asComponentHref } from '$lib/utilities.js';
  import { Button, Icon, Text, VStack, type IconLike } from '@immich/ui';

  type Props = {
    component: { name: string; icon: IconLike };
  };

  const { component }: Props = $props();
</script>

<Button
  href={asComponentHref(component.name)}
  variant="outline"
  color="secondary"
  class="h-24 w-44 rounded-2xl border border-light-300"
  size="large"
>
  <VStack gap={2}>
    <Icon icon={component.icon} size="1.5rem" aria-hidden />
    <Text size="small">{component.name}</Text>
  </VStack>
</Button>
