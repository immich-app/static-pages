<script lang="ts">
  import { browser } from '$app/environment';
  import type { TimelineItem } from '$lib';
  import { Checkbox, Icon, Link, Logo, Text } from '@immich/ui';

  type Props = {
    items: TimelineItem[];
  };

  const { items }: Props = $props();
</script>

<ul class="flex flex-col md:pl-4">
  {#each items as item, index (index)}
    {@const isFirst = index === 0}
    {@const isLast = index === items.length - 1}
    {@const done = item.done ?? true}
    {@const dateLabel = item.getDateLabel(browser ? navigator.language : 'en-US')}
    {@const cardIcon = item.icon}

    <li class="flex gap-2 {done ? '' : 'italic'}">
      <div class="hidden w-32 items-center justify-start overflow-hidden md:flex">
        {dateLabel}
      </div>

      <div class="flex items-center">
        <Checkbox checked={done} readonly shape="round" class="bg-subtle" />
      </div>

      <div
        class="-z-1 flex h-full w-3 -translate-x-6.25 flex-col items-center overflow-hidden"
        class:justify-end={isFirst}
      >
        <div
          class:rounded-t-full={isFirst}
          class:rounded-b-full={isLast}
          class="w-full bg-subtle {isFirst || isLast ? 'h-1/2' : 'h-full'}"
        ></div>
      </div>

      <div class={[isLast ? '' : 'my-2', 'w-full rounded-2xl bg-light-100 p-4']}>
        <div class="flex flex-col gap-2">
          <!-- header -->
          <div class="flex w-full justify-between gap-2">
            <div class="flex items-center gap-2">
              {#if cardIcon === 'immich'}
                <Logo variant="icon" class="h-6" />
              {:else}
                <Icon icon={cardIcon} class={item.iconClass ?? 'text-primary'} />
              {/if}
              <Text color={done ? undefined : 'secondary'} variant={done ? undefined : 'italic'}>{item.title}</Text>
            </div>

            <div class="hidden md:flex">
              <Text color="primary">
                {#if item.link}
                  <Link href={item.link.href}>
                    [{item.link.text}]
                  </Link>
                {/if}
              </Text>
            </div>
          </div>

          <!-- description -->
          <Text color="muted" size="small">{item.description}</Text>

          <!-- footer -->
          <div class="flex items-center justify-between md:hidden">
            <Text color="muted" size="small">
              {dateLabel}
            </Text>
            <Text color="primary">
              {#if item.link}
                <Link href={item.link.href}>
                  [{item.link.text}]
                </Link>
              {/if}
            </Text>
          </div>
        </div>
      </div>
    </li>
  {/each}
</ul>
