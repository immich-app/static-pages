<script lang="ts">
  import { FutoLogo } from '@immich/ui';

  const duration = 2970;
  const windUpEnd = 0.14;
  const spinStart = 0.19;
  const scalePeak = 0.49;

  let coin = $state<HTMLSpanElement>();
  let spinning = false;

  export const spin = () => {
    if (!coin || spinning || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    spinning = true;

    const spinAnimation = coin.animate(
      [
        { rotate: '0deg', easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
        { offset: windUpEnd, rotate: '-32deg', easing: 'ease-in-out' },
        { offset: spinStart, rotate: '-38deg', easing: 'cubic-bezier(0.42, 0, 0.18, 1)' },
        { rotate: '1440deg' },
      ],
      duration,
    );

    coin.animate(
      [
        { scale: '1', easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
        { offset: windUpEnd, scale: '0.93' },
        { offset: spinStart, scale: '0.93', easing: 'ease-out' },
        { offset: scalePeak, scale: '1.06', easing: 'ease-in-out' },
        { scale: '1' },
      ],
      duration,
    );

    coin.animate(
      [
        { filter: 'hue-rotate(0deg) saturate(1) blur(0)' },
        { offset: spinStart, filter: 'hue-rotate(0deg) saturate(1) blur(0)' },
        { offset: 0.45, filter: 'hue-rotate(160deg) saturate(1.6) blur(0.6px)' },
        { offset: 0.7, filter: 'hue-rotate(290deg) saturate(1.3) blur(0.3px)' },
        { filter: 'hue-rotate(360deg) saturate(1) blur(0)' },
      ],
      duration,
    );

    void spinAnimation.finished.catch(() => {}).finally(() => (spinning = false));
  };
</script>

<span bind:this={coin} class="flex size-4" aria-hidden="true">
  <FutoLogo class="size-full" />
</span>
