<script lang="ts">
  import { page } from '$app/state';
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { AppShell, AppShellHeader } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const groups = [
    {
      title: '2024',
      children: [
        { title: 'Introduction', href: '/docs/introduction' },
        { title: 'Setup', href: '/docs/setup' },
        { title: 'Support', href: '/docs/support-the-project' },
      ],
    },
    {
      title: '2023',
      children: [
        { title: 'Requirements', href: '/docs/install/requirements' },
        { title: 'Install Script [Experimental]', href: '/docs/install/install-script' },
        { title: 'Docker Compose [Recommended]', href: '/docs/install/docker-compose' },
        { title: 'Kubernetes', href: '/docs/install/kubernetes' },
        { title: 'Portainer', href: '/docs/install/portainer' },
        { title: 'Unraid', href: '/docs/install/unraid' },
      ],
    },
    {
      title: '2022',
      children: [
        { title: 'Automatic Backup', href: '/docs/features/automatic-backup' },
        { title: 'The Immich CLI', href: '/docs/features/the-immich-cli' },
        { title: 'Facial Recognition', href: '/docs/features/facial-recognition' },
        { title: 'Hardware Transcoding [Experimental]', href: '/docs/features' },
        { title: 'External Libraries', href: '/docs/features' },
        { title: 'Hardware-Accelerated Machine Learning [Experimental]', href: '/docs/features' },
        { title: 'Mobile App', href: '/docs/features' },
        { title: 'Monitoring', href: '/docs/features' },
        { title: 'Partner Sharing', href: '/docs/features' },
        { title: 'Reverse Geocoding', href: '/docs/features' },
        { title: 'Shared Albums & Assets', href: '/docs/features' },
        { title: 'Smart Search', href: '/docs/features' },
        { title: 'Supported Formats', href: '/docs/features' },
        { title: 'User Settings', href: '/docs/features' },
        { title: 'XMP Sidecards', href: '/docs/features' },
      ],
    },
    {
      title: 'Administration',
      children: [{ title: 'Introduction', href: '/docs/administration' }],
    },
    {
      title: 'Developer',
      children: [{ title: 'Introduction', href: '/docs/developer' }],
    },
    {
      title: 'Guides',
      children: [{ title: 'Introduction', href: '/docs/guides' }],
    },
    {
      title: 'Overview',
      children: [{ title: 'Introduction', href: '/docs/overview' }],
    },
  ];

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <!-- <AppShellSidebar class="bg-dark/10 overflow-x-hidden min-w-[300px]">
    <Stack class="p-4">
      {#each groups as group}
        <Stack class="">
          <Heading size="small">{group.title}</Heading>
          <Stack gap={0}>
            {#each group.children as item}
              <a
                href={item.href}
                class="pl-4 py-1 rounded-2xl hover:bg-primary/25 {isActive(item.href)
                  ? 'bg-dark/10 text-primary'
                  : 'text-secondary'}"
              >
                {item.title}
              </a>
            {/each}
          </Stack>
        </Stack>
      {/each}
    </Stack>
  </AppShellSidebar> -->

  <PageContent>
    {@render children?.()}
  </PageContent>
</AppShell>
