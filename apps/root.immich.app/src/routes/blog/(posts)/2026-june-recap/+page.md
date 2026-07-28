---
authors: [Immich Team]
coverAlt: a cat looking up at the sky, also wondering when v3 will be available
coverAttribution: Photo by bo0tzz
coverUrl: https://static.immich.cloud/blog/af8e01bf-2d44-4042-b3de-5d5c463b7b52/58500b2ee903e7098565c940fb53bbb2.webp
description: A recap of June, 2026, including an update on upcoming features,
  releases, developer updates, and more.
id: af8e01bf-2d44-4042-b3de-5d5c463b7b52
publishedAt: 2026-06-30
slug: 2026-june-recap
title: June recap
---

Hello everyone!

The most exciting thing for us this month was pushing out some release candidates for `v3.0.0`, which is right around the corner. If you haven't yet, feel free to try it out and let us know what you think. For more details on this and other news keep reading below.

## FUTO — 2 years later

The team has been working at FUTO for just over 2 years now. A lot has changed in that time, but at the same time a lot has _stayed the same_. Read the full retrospective [post on our blog](/blog/futo-two-years-later) as we reflect back on the last two years.

## Release candidates

We talked a little bit about release candidates last month, but we have a much better understanding about them after implementing our own prerelease workflow a few weeks ago. In short, we have decided to do prereleases for all major releases moving forward. Also, we've built our workflows in a way that it is possible to do prereleases for minor releases as well, which is something we might experiment with moving forward. At the end of the day we know stability is hugely important for users, especially for a photo management application, and we hope implementing release candidates and prereleases will make major version upgrades smoother for everyone.

---

:::info Thank you
A special thank you to everyone who has helped test the release candidates so far! It has helped us find and fix a bunch of issues before the general release, and we appreciate it.

:::

---

## Webhooks

This month we have added a new workflow action: webhooks. Webhooks are HTTP requests to external servers with event data and are often used to integrate with external services. The main benefit of webhooks is that they are push based, instead of pull. Rather than making repeated requests to the Immich API to see when data changes, webhooks can _push_ event information and allow other systems to respond to it.

---

:::info Coming soon
Webhooks will be available in `v3.0.0` as part of the initial launch of workflows.

:::

---

Here is what the webhook trigger action item looks like in the action picker on the web:

![Selected webhook action ](https://static.immich.cloud/blog/af8e01bf-2d44-4042-b3de-5d5c463b7b52/749e388f5abf07e69b08094afa6c158b.webp)

Once the "Trigger Webhook" action has been selected, you are able to configure it with a destination URL, the HTTP request method (POST vs PUT), and an optional header to send with the request. It is quite common for webhooks to require authentication, and the header configuration allows the user to send one with each request.

Here is an example configuration:

![Webhook action configuration form](https://static.immich.cloud/blog/af8e01bf-2d44-4042-b3de-5d5c463b7b52/db169a8da32303e11bc9add7df0725a3.webp)

## Releases

Over the last two weeks there have been a handful of prereleases as we prepare for v3.0.0.

- [v3.0.0-rc.3](https://github.com/immich-app/immich/releases/tag/v3.0.0-rc.3) - Video player keyboard shortcuts, webhook workflow action, fix: sync backfill issue
- [v3.0.0-rc.2](https://github.com/immich-app/immich/releases/tag/v3.0.0-rc.2) - Fix version check logic, fix i18n, fix album sharing, etc.
- [v3.0.0-rc.1](https://github.com/immich-app/immich/releases/tag/v3.0.0-rc.1) - New `v3-rc` docker tag, bugs fixes
- [v3.0.0-rc.0](https://github.com/immich-app/immich/releases/tag/v3.0.0-rc.0) - Breaking changes, workflows & HLS (both in preview), recently added page, slideshow (mobile), and more!

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

Testing, Testing and more testing for v3.0.0 release.

### @jrasm91

There are probably 3 things worth mentioning this month:

1. I found and fixed a long time issue related to mobile sync. The server sends incremental data to the mobile app using queries and checkpoints, which makes it resumable. It turns out there was a classic "off-by-one" bug, where, the resume query used `>=` instead of `>` meaning it would send the the first record again, causing a key violation on the mobile side. The bug can only be triggered under very specific circumstances, but it was 100% reproducible.
2. Prerelease workflow — this month I was able to update our version bumping script to understand prereleases and make it easy to keep all the different version references in sync. As a part of that, major releases will now automatically bump the references in the docs, `example.env`, etc., which is pretty convenient.
3. Workflow actions — Also this month I spent more time adding new workflow actions and events. I am currently working on an "added to album" trigger, meaning it would be possible to do something like "When an asset it added to the 'Archive' album, archive the asset". The biggest issue right now is the album asset table is often very high volume, so it's taking a bit of time to add some bulk capabilities into the workflow engine. It's not ideal to have to find recently created album/asset combinations one at a time, and then (for each one) find and run matching workflows, and then repeat that process for every new album/asset record. It just has the potential for exploding very quickly. So, it's currently work-in-progress, but I know album events are super important for many workflows, which is why it is on the top of the list at the moment.

## Upcoming goals

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
