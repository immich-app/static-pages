<script lang="ts">
  import type { TimelineItem } from '$lib';
  import { posts, siteMetadata } from '$lib';
  import Timeline from '$lib/components/Timeline.svelte';
  import { asGithubLink, Heading, SiteMetadata, Stack, Text } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiBug,
    mdiCalendarToday,
    mdiClockOutline,
    mdiCloseOctagon,
    mdiCloudKeyOutline,
    mdiCodeJson,
    mdiCrop,
    mdiCrosshairsOff,
    mdiDatabase,
    mdiLeadPencil,
    mdiLockOff,
    mdiLockOutline,
    mdiMicrosoftWindows,
    mdiRegex,
    mdiRestart,
    mdiSecurity,
    mdiSpeedometerSlow,
    mdiTrashCan,
    mdiVideoOutline,
    mdiWeb,
    mdiWrap,
  } from '@mdi/js';

  const withBlog = ({ id, ...item }: Omit<Item, 'date' | 'link'> & { id: string }) => {
    const post = posts.find((post) => post.id === id);
    if (!post) {
      throw new Error('Unable to resolve blog post');
    }

    return {
      ...item,
      link: { href: post.url, text: 'Blog' },
      date: post.publishedAt.toJSDate(),
    };
  };

  const withLanguage = (date: Date) => (language: string) => date.toLocaleDateString(language);

  type Item = Omit<TimelineItem, 'done' | 'getDateLabel'> & { date: Date };

  const items: Item[] = [
    {
      icon: mdiVideoOutline,
      title: 'Stabilized videos are cursed',
      description:
        'Video stabilization is cursed because it is implemented via crop metadata which impacts video dimensions and is sometimes automatically applied (depending on the tool), which can make dimension-based calculations wrong.',
      link: asGithubLink({ number: 27251 }),
      date: new Date(2026, 2, 25),
    },
    withBlog({
      id: '019a01e1-4dc0-73db-aebd-623726a62335',
      icon: mdiCloseOctagon,
      title: "Google's safe browsing is cursed",
      iconClass: 'text-danger',
      description:
        'Google\'s safe browsing service is cursed because it can flag legitimate sites as "dangerous" without any human review and continue to do so indefinitely.',
    }),
    {
      icon: mdiClockOutline,
      title: 'setTimeout is cursed',
      description:
        'The setTimeout method in JavaScript is cursed when used with small values because the implementation may or may not actually wait the specified time.',
      link: asGithubLink(20655),
      date: new Date(2025, 7, 4),
    },
    {
      icon: mdiAccountOutline,
      title: 'PostgreSQL USER is cursed',
      description:
        'The USER keyword in PostgreSQL is cursed because you can select from it like a table, which leads to confusion if you have a table name user as well.',
      link: asGithubLink(19891),
      date: new Date(2025, 7, 4),
    },
    {
      icon: mdiRestart,
      title: 'PostgreSQL RESET is cursed',
      description:
        'PostgreSQL RESET is cursed because it is impossible to RESET a PostgreSQL extension parameter if the extension has been uninstalled.',
      link: asGithubLink(19363),
      date: new Date(2025, 5, 20),
    },
    {
      icon: mdiRegex,
      title: 'Zitadel Actions are cursed',
      description:
        "Zitadel is cursed because its custom scripting feature is executed with a JS engine that doesn't support regex named capture groups.",
      link: {
        href: 'https://github.com/dop251/goja',
        text: 'Go JS engine',
      },
      date: new Date(2025, 5, 4),
    },
    {
      icon: mdiCloudKeyOutline,
      title: 'Entra is cursed',
      description:
        "Microsoft Entra supports PKCE, but doesn't include it in its OpenID discovery document. This leads to clients thinking PKCE isn't available.",
      link: asGithubLink(18725),
      date: new Date(2025, 4, 30),
    },
    {
      icon: mdiCrop,
      title: 'Image dimensions in EXIF metadata are cursed',
      description:
        'The dimensions in EXIF metadata can be different from the actual dimensions of the image, causing issues with cropping and resizing.',
      link: asGithubLink(17974),
      date: new Date(2025, 4, 5),
    },
    {
      icon: mdiCodeJson,
      title: 'YAML whitespace is cursed',
      description: 'YAML whitespaces are often handled in unintuitive ways.',
      link: asGithubLink(17309),
      date: new Date(2025, 3, 1),
    },
    {
      icon: mdiMicrosoftWindows,
      title: 'Hidden files in Windows are cursed',
      description:
        'Hidden files in Windows cannot be opened with the "w" flag. That, combined with SMB option "hide dot files" leads to a lot of confusion.',
      link: asGithubLink(12812),
      date: new Date(2024, 8, 20),
    },
    {
      icon: mdiWrap,
      title: 'Carriage returns in bash scripts are cursed',
      description:
        'Git can be configured to automatically convert LF to CRLF on checkout and CRLF breaks bash scripts.',
      link: asGithubLink(11613),
      date: new Date(2024, 7, 7),
    },
    {
      icon: mdiLockOff,
      title: 'Fetch inside Cloudflare Workers is cursed',
      description:
        'Fetch requests in Cloudflare Workers use http by default, even if you explicitly specify https, which can often cause redirect loops.',
      link: {
        href: 'https://community.cloudflare.com/t/does-cloudflare-worker-allow-secure-https-connection-to-fetch-even-on-flexible-ssl/68051/5',
        text: 'Cloudflare',
      },
      date: new Date(2024, 7, 7),
    },
    {
      icon: mdiCrosshairsOff,
      title: 'GPS sharing on mobile is cursed',
      description:
        'Some phones will silently strip GPS data from images when apps without location permission try to access them.',
      link: asGithubLink({ number: 11268, type: 'discussion' }),
      date: new Date(2024, 6, 21),
    },
    {
      icon: mdiLeadPencil,
      title: 'PostgreSQL NOTIFY is cursed',
      description:
        'PostgreSQL does everything in a transaction, including NOTIFY. This means using the socket.io postgres-adapter writes to WAL every 5 seconds.',
      link: asGithubLink(10801),
      date: new Date(2024, 6, 3),
    },
    {
      icon: mdiWeb,
      title: 'npm scripts are cursed',
      description:
        'npm scripts make a http call to the npm registry each time they run, which means they are a terrible way to execute a health check.',
      link: asGithubLink({ number: 10796, type: 'issue' }),
      date: new Date(2024, 6, 3),
    },
    {
      icon: mdiSpeedometerSlow,
      title: '50 extra packages are cursed',
      description:
        'There is a user in the JavaScript community who goes around adding "backwards compatibility" to projects. They do this by adding 50 extra package dependencies to your project, which are maintained by them.',
      link: asGithubLink(10690),
      date: new Date(2024, 5, 28),
    },
    {
      icon: mdiLockOutline,
      title: 'Long passwords are cursed',
      description:
        'The bcrypt implementation only uses the first 72 bytes of a string. Any characters after that are ignored.',
      // link: GHSA-4p64-9f7h-3432
      date: new Date(2024, 5, 25),
    },
    {
      icon: mdiCalendarToday,
      title: 'JavaScript Date objects are cursed',
      description: 'JavaScript date objects are 1 indexed for years and days, but 0 indexed for months.',
      link: asGithubLink(6787),
      date: new Date(2024, 0, 31),
    },
    {
      icon: mdiBug,
      title: 'ESM imports are cursed',
      description:
        'Prior to Node.js v20.8 using --experimental-vm-modules in a CommonJS project that imported an ES module that imported a CommonJS modules would create a segfault and crash Node.js',
      link: asGithubLink(6719),
      date: new Date(2024, 0, 9),
    },
    {
      icon: mdiDatabase,
      title: 'PostgreSQL parameters are cursed',
      description: `PostgresSQL has a limit of ${Number(65535).toLocaleString()} parameters, so bulk inserts can fail with large datasets.`,
      link: asGithubLink(6034),
      date: new Date(2023, 11, 28),
    },
    {
      icon: mdiSecurity,
      title: 'Secure contexts are cursed',
      description: `Some web features like the clipboard API only work in "secure contexts" (ie. https or localhost)`,
      link: asGithubLink({ type: 'issue', number: 2981 }),
      date: new Date(2023, 5, 26),
    },
    {
      icon: mdiTrashCan,
      title: 'TypeORM deletes are cursed',
      description: `The remove implementation in TypeORM mutates the input, deleting the id property from the original object.`,
      link: {
        href: 'https://github.com/typeorm/typeorm/issues/7024#issuecomment-948519328',
        text: 'typeorm#6034',
      },
      date: new Date(2023, 1, 23),
    },
  ];

  const pageMetadata = {
    title: 'Cursed Knowledge',
    description: 'Cursed knowledge we have learned as a result of building Immich that we wish we never knew.',
  };
</script>

<SiteMetadata site={siteMetadata} page={pageMetadata} />

<Stack class="text-center" gap={4}>
  <Heading size="title" tag="h1">{pageMetadata.title}</Heading>
  <Text>{pageMetadata.description}</Text>
</Stack>

<div class="mx-auto mt-8 flex w-full max-w-(--breakpoint-md) justify-around">
  <Timeline
    items={items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((item) => ({ ...item, getDateLabel: withLanguage(item.date) }))}
  />
</div>
