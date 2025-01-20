<script lang="ts">
  import Header from '$lib/components/Header.svelte';
</script>

<Header
  items={[
    { title: 'Download', href: '/download', variant: 'filled', color: 'primary' },
    { title: 'Features', href: '/features' },
    { title: 'Roadmap', href: '/roadmap' },
    { title: 'Docs', href: 'https://immich.app/' },
    { title: 'API', href: '/api' },
    // { title: 'Blog', href: '/blog' },
    // { title: 'FAQs', href: '/faqs' },
  ]}
/>
