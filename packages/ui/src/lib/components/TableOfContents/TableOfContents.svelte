<script lang="ts">
  import Text from '#lib/components/Text/Text.svelte';
  import { t } from '#lib/services/translation.svelte.js';
  import type { TableOfContentsProps } from '#lib/types.js';
  import { cleanClass } from '#lib/utilities/internal.js';

  const { items, translations, class: className, ...restProps }: TableOfContentsProps = $props();

  const title = $derived(t('table_of_contents_title', translations));

  let list = $state<HTMLElement>();
  const listItems: (HTMLElement | null)[] = [];

  let highlight = $state<{ first: number; last: number }>();
  let bar = $state({ top: 0, height: 0, animate: false });

  const getCommonAncestor = (a: Element, b: Element) => {
    let ancestor: Element | null = a;
    while (ancestor && !ancestor.contains(b)) {
      ancestor = ancestor.parentElement;
    }
    return ancestor ?? document.documentElement;
  };

  const getScrollContainer = (element: Element) => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
    }
  };

  $effect(() => {
    const sections = items.flatMap(({ id }, index) => {
      const heading = document.querySelector(`#${CSS.escape(id)}`);
      return heading ? [{ index, heading }] : [];
    });
    const [firstSection] = sections;
    const lastSection = sections.at(-1);
    if (!list || !firstSection || !lastSection) {
      highlight = undefined;
      return;
    }

    const content = getCommonAncestor(firstSection.heading.parentElement ?? firstSection.heading, lastSection.heading);
    let container: HTMLElement | undefined;
    let scroller: EventTarget | undefined;

    const update = () => {
      if (!list?.checkVisibility()) {
        return;
      }

      const viewport = container?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
      const contentEnd = content.getBoundingClientRect().bottom;
      // anchor jumps can leave a sub-pixel sliver of the previous section
      const minOverlap = 1 / window.devicePixelRatio;

      const visible = sections.filter(({ heading }, i) => {
        const start = heading.getBoundingClientRect().top;
        const end = sections[i + 1]?.heading.getBoundingClientRect().top ?? contentEnd;
        return Math.min(end, viewport.bottom) - Math.max(start, viewport.top) >= minOverlap;
      });
      const first = visible.at(0)?.index;
      const last = visible.at(-1)?.index;
      const firstItem = first === undefined ? undefined : listItems[first];
      const lastItem = last === undefined ? undefined : listItems[last];
      if (first === undefined || last === undefined || !firstItem || !lastItem) {
        highlight = undefined;
        return;
      }

      const listTop = list.getBoundingClientRect().top;
      const top = firstItem.getBoundingClientRect().top - listTop;
      const height = lastItem.getBoundingClientRect().bottom - listTop - top;
      if (bar.top !== top || bar.height !== height) {
        // jump into place when appearing rather than growing from the previous position
        bar = { top, height, animate: !!highlight };
      }
      if (highlight?.first !== first || highlight.last !== last) {
        highlight = { first, last };
      }
    };

    let frame: number | undefined;
    const schedule = () => {
      frame ??= requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    };

    // the container can change as content grows enough to overflow it
    const attachScroller = () => {
      container = getScrollContainer(firstSection.heading);
      const next = container ?? globalThis;
      if (next === scroller) {
        return;
      }
      scroller?.removeEventListener('scroll', schedule);
      scroller = next;
      scroller.addEventListener('scroll', schedule, { passive: true });
    };

    // update only from callbacks, so this effect doesn't subscribe to the highlight it writes
    attachScroller();
    addEventListener('resize', schedule, { passive: true });
    const observer = new ResizeObserver(() => {
      attachScroller();
      schedule();
    });
    observer.observe(content);
    observer.observe(list);

    return () => {
      scroller?.removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      observer.disconnect();
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
    };
  });

  const isHighlighted = (index: number) => !!highlight && index >= highlight.first && index <= highlight.last;
</script>

<aside class={cleanClass('hidden w-56 shrink-0 xl:block', className)} aria-label={title} {...restProps}>
  <div class="sticky top-8">
    <Text color="muted" size="small" fontWeight="semi-bold">{title}</Text>
    <div class="relative mt-3">
      <ul bind:this={list} class="flex flex-col border-s text-sm">
        {#each items as item, i (item.id)}
          <li bind:this={listItems[i]} class={item.level === 3 ? 'py-1 ps-6' : 'py-1 ps-3'}>
            <a
              href="#{item.id}"
              aria-current={highlight?.first === i ? 'location' : undefined}
              class={cleanClass(
                'hover:text-primary! block transition-colors rounded-xs outline-primary outline-offset-1 focus-visible:outline-2',
                isHighlighted(i) ? 'text-dark' : 'text-muted',
              )}
            >
              {item.text}
            </a>
          </li>
        {/each}
      </ul>
      <div
        class={cleanClass(
          'bg-primary pointer-events-none absolute -start-px w-0.5 duration-300 ease-out',
          bar.animate ? 'transition-all' : 'transition-opacity',
          highlight ? 'opacity-100' : 'opacity-0',
        )}
        style:top="{bar.top}px"
        style:height="{bar.height}px"
        aria-hidden="true"
      ></div>
    </div>
  </div>
</aside>
