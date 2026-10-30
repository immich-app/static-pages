---
authors: [Immich Team]
coverAlt: Pumpkins, pumpkins, pumpkins.
coverAttribution: Photo by Jason
coverHeight: 1304
coverSrcset:
  https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/276e145a30f5d84045afddd47e830c9a-720.avif
  720w,
  https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/276e145a30f5d84045afddd47e830c9a-1080.avif
  1080w,
  https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/276e145a30f5d84045afddd47e830c9a-1440.avif
  1440w,
  https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/276e145a30f5d84045afddd47e830c9a-2160.avif
  2160w
coverUrl: https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/276e145a30f5d84045afddd47e830c9a-2160.avif
coverWidth: 2160
description: A recap of October, 2026, including an update on upcoming features,
  releases, developer updates, and more.
id: 4689e8ab-754d-4806-9321-481580d54d9b
publishedAt: 2026-10-30
slug: 2026-october-recap
title: October recap
type: recap
---

Hello everyone!

As quickly as October arrived, we've already reached the end of it. This month, we have shipped `v3.3` which brought person sharing, birthday memories, new OCR models, and many more features, improvements, and bug fixes. We also just started with release candidates for `v3.4`. Notably, that release brings support for passkeys. In addition we have started with planning for the upcoming `v4` release which is going to migrate away from PostgreSQL 14 (finally!). We also launched the private beta for **FUTO backups**. Congratulations to everyone who already received an invite. If you haven't, stay tuned as we will open many more slots soon! If you read this blog post and ask about it on Discord, we may also have an invite code for a few of you :)

## :this-is-fine: 4️⃣

:::warning
If anyone is still running an Immich version `< v3.3.5`, upgrade now!

:::

This month, the internet burned for a few days. Not only was a remote code execution (RCE) vulnerability found in PHP; [PHP2Shell](https://www.wiz.io/blog/php2shell-php-rce) (add it to the list of reasons why we are very glad Immich is not using PHP), intermediate CA certificates by eMudhra were accidentally published with a weak private key ([https://emudhra.we-have-a-problem.com](https://emudhra.we-have-a-problem.com/)), and a bug in the [Brotli](https://github.com/google/brotli) decoder in NodeJS allowed for yet another RCE; [Brotli2Shell](https://broccoli2shell.com/).

Suffice to say, almost all systems on the internet were vulnerable to really bad bugs, compromising the security and integrity.

Immich was vulnerable to the last two CVEs as NodeJS bundles its own trust store and we are using Brotli. This was a perfect example of how flexible the new release pipeline is. We were able to immediately publish a patch release for `v3.3`, even though many changes had already been merged to `main`.

## Passkeys

Users have been asking for additional options besides OAuth and username/password login ever since Immich started. For a long time we haven't felt mature enough and always preferred to defer any additional authentication complexity to identity providers. However, we have reached a point where it seems sensible to revisit some of those early decisions. It turns out, supporting passkeys actually isn't too bad, besides some minor limitations. The entire server and web implementation has been done in a single, reasonably sized PR <https://github.com/immich-app/immich/pull/32194>.

One issue we did run into is about mobile support. Passkeys belong to a specific domain and/or mobile app identifier. In an app such as Immich however, you may use the app to connect to various different servers which all have different passkeys registered with them. Further, we also don't want to send a passkey to an unrelated server. Similarly, a user may also have different ways/domains to access Immich and wants their passkeys to work on each of them. All of these things make implementing passkeys on mobile a bit more complicated, but we think we’re close to getting it to work and it should be available soon.

## Pull request triaging

Since the project first started the number of open pull requests has constantly been growing. I suppose this is correlated with both the project’s popularity as well as the advent of coding agents. For whatever reason, especially in the last 2-3 months there has been a big spike. While getting ready for the `v3.4` release, the team did spend some time triaging open pull requests and we were able to get many of them merged. Our open count is back under 200, which is nice to see again.

<Markdown.Image src="https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/0ff3ae2429afa34b684c363ea0a6fab5-984.avif" srcset="https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/0ff3ae2429afa34b684c363ea0a6fab5-720.avif 720w, https://static.immich.cloud/blog/4689e8ab-754d-4806-9321-481580d54d9b/0ff3ae2429afa34b684c363ea0a6fab5-984.avif 984w" width="984" height="571" alt="A graph of open pull requests over time." />

## Releases

This month we had one minor release and 4 patch releases.

- [v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0) - people sharing, birthday memories, auto-stacked mobile edits and more!

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

We have many secret projects that we can’t wait to share.

### @jrasm91

This month I worked on a few interesting things.

#### Custom release notes

Now that we have this whole backport thing for patches, it makes it a bit more difficult to track _who_ authored the original change, and _when_. The cherry-picked commit always comes across via a bot user (`immich-push-o-matic[bot]`), so I made a custom script to follow the bot commits back to the original PR, which allows us to credit the original the author instead of the bot. Another issue with release branches and backports is that a commit on main (that is backported) would also get included _again_ in the next minor release notes. The custom script now can also strip out those duplicate commits, getting us back to a useful, working changelog.

#### TanStack Query

The web application actually has a bunch of random code that does different versions of:

- avoid making duplicate API requests across pages
- use an in-memory cache for recently queried data
- invalidate page data after a mutation, and sync the change to other components
- periodically refresh data on some interval

It is all related to caching API responses and sharing them throughout the app. It turns out that instead of hand rolling this a bunch of different ways there is a popular library “TanStack Query” (`@tanstack/svelte-query` is what we’re using) that we can use instead. I spent a lot of this month migrating many API methods to this library and I have been thoroughly enjoying the outcome. The code is much easier to understand.

#### Passkeys

I have also been working on implementing passkeys, which is done on the web and should be available in the `v3.4` release. Passkeys is a bit of a hot topic, since it is security related and we have generally taken a pretty firm stance that additional security features are always delegated to an external authentication system... Who knows what this will mean moving forward.

### @danieldietzler

Well, who would've thought updating all server and web dependencies of a large project such as Immich will actually take multiple weeks on and off… Due to the way we had renovate configured, it always rate limited itself on the amount of PRs it can open, resulting in a lot of major version bumps never even showing up. We realized and resolved this, and were left with a few dozen major dependency updates across the project as a result 😅.

After implementing a bunch of feedback we got on people sharing (thanks!) at the beginning of October, I basically spent the rest of the month trying to get our PR count down by getting people's PRs reviewed and merged, and working my way through all those dependencies.

Oh, and on an off-topic note; I also went to a board game congress in Germany! :)

## **Next month**

Well, that's it for this month. Next month we plan to publish `v3.4` and then turn our attention to `v4` with migrating off of PostgreSQL 14 being the main focus.

As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
