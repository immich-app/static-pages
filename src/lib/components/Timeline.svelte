<script lang="ts">
  import { browser } from '$app/environment';
  import type { TimelineItem } from '$lib/types';
  import { Icon, Link, Logo, Text } from '@immich/ui';
  import { mdiCheckboxBlankCircle, mdiCheckboxMarkedCircle } from '@mdi/js';

  type Props = {
    items: TimelineItem[];
  };

  const { items }: Props = $props();
</script>

<ul class="flex flex-col pl-4 -z-1">
  {#each items as item, index (index)}
    {@const isFirst = index === 0}
    {@const isLast = index === items.length - 1}
    {@const done = item.done ?? true}
    {@const dateLabel = item.getDateLabel(browser ? navigator.language : 'en-US')}
    {@const timelineIcon = done ? mdiCheckboxMarkedCircle : mdiCheckboxBlankCircle}
    {@const cardIcon = item.icon}

    <li class="flex min-h-24 {done ? '' : 'italic'}">
      <div class="md:flex justify-start w-36 mr-8 items-center dark:text-immich-dark-primary text-primary hidden">
        {dateLabel}
      </div>
      <div class={`${isFirst && 'relative top-[50%]'} ${isLast && 'relative bottom-[50%]'}`}>
        <div
          class={`h-full border-solid border-4 border-immich-primary dark:border-immich-dark-primary ${
            isFirst && 'rounded rounded-t-full'
          } ${isLast && 'rounded rounded-b-full'}`}
        ></div>
      </div>
      <div
        class="flex items-center bg-primary border-2 border-light border-solid rounded-full text-light relative top-[50%] left-[-3px] translate-y-[-50%] translate-x-[-50%] w-6 h-6 shadow-lg"
      >
        <Icon icon={timelineIcon} size="1em" class="h-6 w-6" />
      </div>
      <section
        class="bg-subtle border rounded-2xl flex w-full gap-2 p-4 md:ml-4 my-2 hover:bg-primary/10 transition-all"
      >
        <div class="flex flex-col grow justify-between gap-2">
          <div class="flex gap-2 items-center">
            {#if cardIcon === 'immich'}
              <Logo size="tiny" variant="icon" />
            {:else}
              <Icon icon={cardIcon} color={item.iconColor} />
            {/if}
            <p class="m-0 mt-1 text-lg items-start flex gap-2 place-items-center content-center">
              <span>{item.title}</span>
            </p>
          </div>
          <Text color="muted" size="small">{item.description}</Text>
        </div>
        <div class="flex flex-col justify-between place-items-end">
          <span class="text-primary">
            {#if item.link}
              <Link href={item.link.url} external underline={false}>
                [{item.link.text}]
              </Link>
            {/if}
          </span>
          <div class="md:hidden text-sm text-right">{dateLabel}</div>
        </div>
      </section>
    </li>
  {/each}
</ul>
