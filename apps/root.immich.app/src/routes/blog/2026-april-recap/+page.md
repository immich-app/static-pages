---
authors: [Immich Team]
coverAlt: 'My bike next to a reservoir surrounded by trees '
coverAttribution: Photo by Jason
coverUrl: https://static.immich.cloud/blog/9c740a9a-d239-4213-8bf6-08670f572f07/612252b9f9112533730fe00318af4cd9.webp
description: A recap of April, 2026, including an update on upcoming features, releases,
  developer updates, and more.
id: 9c740a9a-d239-4213-8bf6-08670f572f07
publishedAt: 2026-04-30
slug: 2026-april-recap
title: April recap
---

Hello everyone!

April has been all about preparing for Immich `v3.0.0`, which will be our first major release since the [stable release](https://immich.app/blog/stable-release) last October. The major release primarily revolves around a number of deprecated items we have wanted to delete for some time. The good news is that **most** of the changes are behind-the-scenes and won't require user intervention. Keep reading below for more details on all this and more.

## Roadmap update

We've added a few more items to our roadmap this month:

![](https://static.immich.cloud/blog/9c740a9a-d239-4213-8bf6-08670f572f07/a8102958ad18082a796785b4c059d1ea.webp)

The video streaming improvements are currently being worked on and will enable users to experience the best possible video quality based on their device and bandwidth. The long-term goal is to make video playback as smooth, snappy, and high-quality as possible.

The new reverse geocoding system is almost done being built and offers many improvements over the current one, the main one being accuracy. With data now being sourced from [OpenStreetMap](https://www.openstreetmap.org/), we have actual boundaries we can test GPS coordinates against, which is much better and allows us to be much more accurate when doing GPS lookups. We will also have the option to have point-of-interest (POI) information, such as buildings and attractions that you are currently in or near.

## Road to `v3.0.0`

:::info
We also do our best to keep the API documentation up to date as well and you can see a list of known, deprecated endpoints [here](https://api.immich.app/endpoints/deprecated).

:::

There is an ever-growing list of [breaking changes](https://github.com/immich-app/immich/pulls?q=is%3Apr+label%3Achangelog%3Abreaking-change+is%3Aclosed) that have been merged into main. So far, we've deleted over 69k lines of code, which has been awesome. Here are some of the more significant changes:

- The `replaceAsset` endpoint has been removed
- The old timeline on mobile has been removed, along with the old sync endpoints
- `album.owner` has been relocated to `album.users` (with a role of `owner`)
- `deviceId` and `deviceAssetId` no longer exist :tada:
- `/assets/random` has been removed (use `/search/random` instead)
- `asset.duration` is changing from a string `"00:00:05"` to a number `5000` (milliseconds)
- Asset responses will no longer include information about faces, just named people

You can also see the full list of [GitHub](https://github.com/immich-app/immich/pulls?q=is%3Apr+label%3Achangelog%3Abreaking-change+is%3Aclosed), and if you have any questions or concerns about the changes, shoot us a message on [Discord](https://discord.immich.app/) in the `#contributing` channel.

## Features

Aside from the breaking changes that require a major version bump, we're working hard on some shiny features, some of which _might_ land in v3.

### Better sharing

We have _started_ work on the ["better sharing"](https://github.com/immich-app/immich/issues/12614) issue. Needless to say, the task is _massive_, but we're starting with adding the option to share and manage people owned by other users. This is great for family setups or when you are sharing your library with partners, and a single unified set of people makes a lot more sense than user-scoped versions. There are a lot of nuances that we're still figuring out, but it's coming along nicely so far.

### HTTP live streaming

As mentioned in other parts of this post, work has begun on implementing HTTP Live Streaming (HLS). This feature will enable smoother and higher-quality playback for clients and is something we are pretty excited about. The main idea of the protocol is that the client can automatically upgrade the stream based on network conditions and the time it takes to download video segments.

### OAuth improvements

We also have a growing collection of OAuth improvements, including:

- Support for the `prompt` parameter (to force account selection, etc.)
- Back channel logout support
- Custom logout endpoint
- Security improvements for profile images, secure-by-default requests, and account linking

### Workflows & plugins

We have already talked about this a bunch, and work continues to progress so stay tuned.

## Releases

We published 1 minor release this month:

- [v2.7.0](https://github.com/immich-app/immich/releases/tag/v2.7.0) - Asset and duplicate viewer enhancements, helmet configuration, editor shortcuts

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

I've always kept an eye out for discussions and sentiment around the project to better understand our users' needs and requests, so that we can balance our priorities with the team's workload. The majority of feature request discussions took place in a chill, relaxed environment. However, I've seen some heated arguments when a request is decided not to be worked on, and the team is painted as not listening to users in the most negative way. Comments like those are really hard to read and have a negative impact on the team, so I hope we can all be understanding of each other and put ourselves in each other's shoes to be more empathetic.

### @jrasm91

As previously stated, this month has been all about breaking changes for `v3`. For me, this is mostly about removing deprecated API endpoints, fixing request/response structures, reviewing the change from [class-validator](https://github.com/typestack/class-validator) to [Zod](https://zod.dev/), etc. Immich continues to grow, and it's healthy to regularly clean up the code.

I also spent a bit of time working on [Immich UI](https://ui.immich.app/), which has a new home page, an improved command palette, and automatic theme detection (no more flash bangs!).

![New Immich UI homepage](https://static.immich.cloud/blog/9c740a9a-d239-4213-8bf6-08670f572f07/827a36ff5e50c5b67be21dbe515446c1.webp)

Many of these improvements were made to the library itself, and have been rolled out to the rest of our sites like <https://immich.app,> <https://api.immich.app/,> etc.

Also, the Immich API website now links to the replacement endpoint, when available.

![Deprecated getRandom endpoint now links to searchAssets](https://static.immich.cloud/blog/9c740a9a-d239-4213-8bf6-08670f572f07/44dd74935441036c8f4595550fbe60bd.webp)

Now, time to get back to workflows :smile:.

### @danieldietzler

I also spent a part of this month working on breaking changes for v3 and co-reviewing some of the huge PRs that made their way in. However, my primary focus has been on the aforementioned sharing rework. After some extensive planning and loooong discussions within the team, I finally started working on a proof of concept. Preliminary results seem to be promising so far; I'm (carefully) optimistic that the approach is gonna work out. I am excited to start re-implementing the changes properly soon™️ after getting some feedback from the team. I know this is one of the most highly requested features at the moment. I can't wait to to see this shipped eventually, hopefully addressing most of your use cases and wishes!

### @bwees

Mobile editing ([#25397](https://github.com/immich-app/immich/pull/25397)) has been merged! This has been a long time coming. I hope everyone can enjoy the new editing experience on mobile in the upcoming v3 release!

I have been helping out on the breaking changes for v3. It has felt super good to finally get rid of some of the complexity and messy code in some parts of the codebase. We have found some incredibly deep dependency trees for some parts of the API responses and it has been tricky to work around those at times.

### @mertalev

HLS and real-time transcoding has been my focus for this month. There are a lot of interesting aspects to this, ranging from serving a playlist with all the split up video segments before the server actually has them, switching between qualities and figuring out how to make playback start quickly enough for this to have a good UX.

I knew there were a lot of details going in, but I was still surprised by just how much I needed to learn about how FFmpeg works. You need to know exactly what it will make before it actually makes it and ensure the segment boundaries continue to line up correctly even if the user seeks or switches quality.

One thing that surprised me was that HLS clients panic and switch quality when a server doesn't respond immediately, since they think the bandwidth is either bad or the server has problems. What's more is that different HLS clients handle this differently, so what works on web might not work for iOS and vice versa. The easy way out would be to force a specific quality by only offering one variant in the HLS playlist, but I wanted to lean into having the client choose what's best for it. There are some tentative fixes to make this behave properly.

Another wrinkle has been that Immich can scale to multiple servers, so we needed to figure out how to make sure one server transcodes a given video session across requests without each request potentially starting a new transcoding process. The solution so far has been to use websocket events and the DB to coordinate the servers.

## Upcoming goals

Looking forward into May we hope to release `v3.0.0` with an initial version of Workflows, as well as make progress of some of those big features mentioned earlier. Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>
