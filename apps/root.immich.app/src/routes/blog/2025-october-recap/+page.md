---
id: 019a3a53-116f-72c8-91e9-0ba97d85ad57
title: October recap
description: A recap of October, 2025, including news, releases, announcements, and more.
publishedAt: 2025-10-31
authors: [Immich Team]
---

<script>
  import { mdiHalloween } from '@mdi/js';
  import { Icon, Button, Constants } from '@immich/ui';
</script>

<div class="w-full flex justify-around gap-2">
  {#each [0, 1, 2, 3, 4] as i (i)}
  <div class="rounded-full p-2 bg-orange-100 dark:bg-orange-950 text-black overflow-hidden {i < 2? 'hidden lg:block' : ''}">
    <Icon icon={mdiHalloween} class="text-orange-500 w-full" size="100%" />
  </div>
  {/each}
</div>

---

Hello everyone!

The month of October was an exciting and busy month for the Immich team. We had our [stable release](/blog/stable-release), were trending on [Hacker News](https://news.ycombinator.com/item?id=45675015), launched [new websites](https://awesome.immich.app/), delivered [OCR](https://github.com/immich-app/immich/releases/tag/v2.2.0), and much more. Continue below to read the full recap of October 2025, as well as a developer update and upcoming goals.

## Stable release

The month kicked off with the announcement of our long-awaited [stable release](/blog/stable-release) 🎉!

Preparing for and releasing `v2.0.0` was actually a bit more stressful than you might have imagined. It took a lot of work and coordination from the entire team, and we are all very excited to have successfully delivered it this month. To celebrate the release, we also launched [new merch](https://immich.store/collections/immich-2-0) 👕, the limited-edition [Retro DVD](https://immich.store/products/immich-retro) 📀, and our [new website](https://immich.app/).

We are blown away by the support from everyone around this milestone, especially for the [Retro DVD ](https://immich.store/products/immich-retro)**📀**! If you want to get one for yourself, you still can, but once this batch is gone, we won’t be making any more, **EVER!** So get one while you can from [immich.store](https://immich.store/)!

<img src="https://static.immich.cloud/img/immich-retro-spine.webp" alt="Retro DVD spine" class="pb-4"/>

## Releases

Including the stable release, we had 3 releases this month (excluding patch releases).

- [v2.2.0](https://github.com/immich-app/immich/releases/tag/v2.2.0) &mdash; Activity view (mobile), video seeking (mobile), duplicate management improvements (web), and **OCR**
- [v2.1.0](https://github.com/immich-app/immich/releases/tag/v2.1.0) &mdash; Improved slideshow shuffle (web), upload to stack (web), album notifications (web)
- [v2.0.0](https://github.com/immich-app/immich/releases/tag/v2.0.0) &mdash; Stable release

## Immich on Hacker News

This month, we published a few blog posts on our website, including one that was #1 on Hacker News for a while, racking up an impressive 1400+ points: [Google flags Immich sites as dangerous](https://news.ycombinator.com/item?id=45675015).

## New homepage

https://immich.app/

With the launch of `v2.0.0` we published an updated version of our main website, which now uses our own Svelte component library. If you have any feedback or notice any bugs, please reach out to us on [GitHub](https://github.com/immich-app/immich) or [Discord](https://discord.immich.app/).

## New API documentation

https://api.immich.app/

We also moved our auto-generated API documentation to a new site: https://api.immich.app/. The site is designed for developers building integrations on top of the Immich API. It provides information on authenticating with the Immich API, details about the permission system, and instructions on authenticating requests, as well as a built-in API playground. If you have any feedback or notice any bugs, please reach out to us on [GitHub](https://github.com/immich-app/immich) or [Discord](https://discord.immich.app/).

## Awesome Immich

https://awesome.immich.app/

Also, this month, we launched https://awesome.immich.app/, a list of awesome Immich apps, integrations, tools, distributions, and guides. It replaces the `Community Projects` and `Community Guides` sections of our [documentation website](https://docs.immich.app/), and aims to be a central place where you can discover awesome things related to Immich. If you have or know of a project, tool, or guide that should be added, feel free to [open a pull request.](https://github.com/immich-app/static-pages/edit/main/apps/awesome.immich.app/src/data/items.json)

## Optical character recognition (OCR)

With [over 300 upvotes](https://github.com/immich-app/immich/discussions/3168), the highly requested **OCR** feature has been officially implemented and delivered as part of the [v2.2.0](https://github.com/immich-app/immich/releases/tag/v2.2.0) release. This feature enables automatic extraction of text from images, making it easier to search for lost family recipes or a crypto wallet’s passphrase 😀.

## Community growth

This month, we reached **83,000** stars on our [GitHub repository](https://github.com/immich-app/immich), moving the project into 5th place on [selfh.st](https://selfh.st/apps/), when sorted by star count. On Reddit [r/immich](https://www.reddit.com/r/immich) also recently passed **38,000** members.

If you want to follow along with us, you can see these metrics and more on <https://data.immich.app/>!

## Developer update &mdash; from the labyrinth

_Our team members’ unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

**Alex** &mdash; Handling the initial iCloud backup is still a PITA, but seeing the crash rate of Android tick down makes me happy. However, I am still not satisfied with the current upload situation. OCR is actually very cool for playing “I Spy” with your kids. I will finally get to work on the workflow feature, which I’ve always wanted for a long time.

**Jason** &mdash; What is a vite preprocessor? Well, it turns out that you can transform code from one format to another using [vite plugins](https://vite.dev/guide/api-plugin.html#transforming-custom-file-types). This month I wrote my own, in order make it possible to write blog posts in markdown, but render them using our own custom Svelte components.

**Zack** &mdash; In the run up to stable release, I thought I would be working on bug fixes and other coordination around the release. Alas no, after we decided to launch the [Immich Retro DVD](https://immich.store/products/immich-retro), it turns out worldwide fulfillment is still not a solved problem… so now I know far more than I ever wanted to about global fulfillment, tax laws, hooking all those systems together, and plenty more. At least it seems like people liked it 😅

## Upcoming goals

Looking into November, here are some of the things we will be working on:

- **OCR** — we will continue to refine and improve the feature, which will likely include adding a way to view the detected text, similar to how you can view detected faces
- **Database restore UI** — we will likely start to build out a process for restoring a database backup through the web application, internally referred to as “maintenance mode”
- **Workflows** — we hope to kick off initial work on this feature, which aims to make it possible for users to customize different automations, like automatically adding pictures to albums, based on conditions, etc.

Well, that’s it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
