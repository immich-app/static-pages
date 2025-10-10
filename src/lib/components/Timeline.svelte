<script lang="ts">
  import { browser } from '$app/environment';
  import type { TimelineItem } from '$lib/types';
  import { Card, CardBody, Checkbox, Icon, Link, Logo, Text } from '@immich/ui';

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
      <div class="md:flex justify-start w-32 items-center hidden overflow-hidden">
        {dateLabel}
      </div>

      <div class="flex items-center">
        <Checkbox checked={done} readonly shape="round" class="bg-subtle" />
      </div>

      <div
        class="flex flex-col h-full items-center -translate-x-[25px] w-[12px] overflow-hidden -z-1"
        class:justify-end={isFirst}
      >
        <div
          class:rounded-t-full={isFirst}
          class:rounded-b-full={isLast}
          class="bg-subtle w-full {isFirst || isLast ? 'h-1/2' : 'h-full'}"
        ></div>
      </div>

      <!-- card -->
      <Card color="secondary" class={isLast ? '' : 'my-2'}>
        <CardBody>
          <div class="flex flex-col gap-2">
            <!-- header -->
            <div class="flex w-full gap-2 justify-between">
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
                    <Link href={item.link.url}>
                      [{item.link.text}]
                    </Link>
                  {/if}
                </Text>
              </div>
            </div>

            <!-- description -->
            <Text color="muted" size="small">{item.description}</Text>

            <!-- footer -->
            <div class="flex md:hidden justify-between items-center">
              <Text color="muted" size="small">
                {dateLabel}
              </Text>
              <Text color="primary">
                {#if item.link}
                  <Link href={item.link.url}>
                    [{item.link.text}]
                  </Link>
                {/if}
              </Text>
            </div>
          </div>
        </CardBody>
      </Card>
    </li>
  {/each}
</ul>
