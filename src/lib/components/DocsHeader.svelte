<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import type { HeaderItem } from '$lib/types';

  const items: HeaderItem[] = [
    { title: 'Download', href: '/download', color: 'primary', variant: 'filled' },
    { title: 'Features', href: '/features' },
    { title: 'About', href: '/about' },
    { title: 'Blog', href: '/blog' },
    { title: 'Docs', href: '/docs' },
    { title: 'FAQ', href: '/faqs' },
  ];
</script>

<Header {items} />
