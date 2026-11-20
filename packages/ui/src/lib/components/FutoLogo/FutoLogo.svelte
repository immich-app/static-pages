<script lang="ts">
  import type { Size } from '#lib/types.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { tv } from 'tailwind-variants';

  type Props = {
    size?: Size;
    class?: string;
  };

  const { size = 'medium', class: className }: Props = $props();

  const uid = $props.id();
  const gradientId = `futo-logo-gradient-${uid}`;

  const styles = tv({
    base: 'aspect-square shrink-0',
    variants: {
      size: {
        tiny: 'h-8',
        small: 'h-10',
        medium: 'h-12',
        large: 'h-16',
        giant: 'h-24',
      },
    },
  });
</script>

<svg viewBox="0 0 24 24" class={cleanClass(styles({ size }), className)} role="img" aria-label="FUTO logo">
  <defs>
    <linearGradient id={gradientId} x1="-67.69" y1="0" x2="22.64" y2="28.33" gradientUnits="userSpaceOnUse">
      <stop stop-color="#405DB1" />
      <stop offset="0.5" stop-color="#4F91DC" />
      <stop offset="1" stop-color="#1BACC6" />
    </linearGradient>
  </defs>
  <path
    fill="url(#{gradientId})"
    fill-rule="evenodd"
    d="M12.0005 0C18.6278 8.58041e-05 24 5.373 24 12.0005C23.9998 18.6279 18.6277 23.9999 12.0005 24C5.37322 24 0.000172714 18.6279 0 12.0005C0 5.37295 5.37312 0 12.0005 0ZM12.1187 6.35112C11.3541 6.35116 10.7382 6.96614 9.50741 8.1969L8.50466 9.20038C7.27413 10.4309 6.65877 11.0462 6.65873 11.8108C6.65873 12.5755 7.27384 13.1914 8.50466 14.4222L9.50741 15.4247C10.7382 16.6555 11.3541 17.2714 12.1187 17.2715C12.8833 17.2715 13.4992 16.6555 14.73 15.4247L15.7327 14.4222C16.9636 13.1914 17.5787 12.5755 17.5787 11.8108C17.5786 11.0462 16.9634 10.431 15.7327 9.20038L14.73 8.1969C13.4992 6.9661 12.8833 6.35112 12.1187 6.35112Z"
  />
</svg>
