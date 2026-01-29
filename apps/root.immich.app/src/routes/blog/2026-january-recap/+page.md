---
authors: [Immich Team]
coverAlt: Calm lake set against a snowy mountain
coverAttribution:
  Photo by <a href="https://unsplash.com/@jakehills?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Jake
  Hills</a> on <a href="https://unsplash.com/photos/landscape-photography-of-horizon-mI02K_LxlfU">Unsplash</a>
coverUrl: https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/496363a1c3633d9ad97bd5b5cba61353.webp
description: A recap of January, 2026, including an update on upcoming features, releases,
  developer updates, and more.
id: fe82bb73-0959-4867-a669-4de0f21a0e91
publishedAt: 2026-01-29
slug: 2026-january-recap
title: January recap
---

Hello everyone!

January has already come and gone, but it feels like [2025](/blog/2025-year-in-review) _just_ ended. Either way, it's time for another project update. So far this month we have published our [2nd security advisory](https://github.com/immich-app/immich/security/advisories/GHSA-237r-x578-h5mv), crossed off a few big items from our [roadmap](https://immich.app/roadmap), and had our [first release of the year](https://github.com/immich-app/immich/releases/tag/v2.5.0). Keep reading below for the full details.

Some of us also be at [FOSDEM](https://fosdem.org) again this upcoming weekend (January 31st and February 1st). If you happen to be around and see us, please say hi! We even have some goodies :)

## Security advisory

We recently patched an issue with API key permissions. An API key created with the `apiKey.update` permission was previously able to update itself with the `all` permission. This vulnerability has been patched in `v2.5.0`. For more details, see the published advisory [here](https://github.com/immich-app/immich/security/advisories/GHSA-237r-x578-h5mv).

## Roadmap update

In January, we crossed off the following items from our [roadmap](http://immich.app/roadmap):

- Basic editor — Crop, rotate, and mirror images directly in Immich
- Database backup & restore — Manage and restore database backups via the web interface
- Free up space on mobile — Automatically delete files that have already been backed up
- 90,000 stars on GitHub :tada:

We also decided to add a few items that we are planning on building (hopefully this year):

- Smart memories — Automatically create memories based on events, locations, and people
- iCloud import — Build a better way to import large iCloud libraries

## Releases

We published 1 minor release this month:

- [v2.5.0](https://github.com/immich-app/immich/releases/tag/v2.5.0) - Database restores, free up space, non-destructive editing, upload improvements

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

This month has been pretty crazy with testing, especially in preparing for `v2.5.0` release, which introduced many new features as well as touched some core mechanisms such as upload and image rendering. I've gotten into a habit of "doom-scrolling" on Immich and clicking around to discover bugs when I have free time instead of going on Reddit or other social media.

This release is a banger, though. Besides a heart-stopping moment about the Android app issue that halted the release of the mobile version, I believe it's been a pretty smooth rollout, and it's great to see our users enjoy the new features.

I plan to continue working on the workflows feature to release it in `v2.6.0`. I was running into some roadblocks while building the filters, which are related to Rust and asynchronous code.

### @jrasm91

Most of the work that I've been focused on this month has been refactoring the web codebase. Related to that I have added a few new components to the UI library, including:

- `ImageCarousel`
- `BasicModal`
- `Table`
- `ActionButton`
- `ListButton`
- `ControlBar`

One area that I have been focusing on is the _asset viewer actions_. Actions include things like download, share, add to album, view in timeline, etc. There is a lot of complexity with these because the same asset viewer is used in a bunch of different contexts, including the timeline, shared links, viewing your own assets, and viewing shared assets. Each action used to be wrapped by a bunch of `if` statements, but these have been replaced with a common interface that makes it easier to control and test. While not the most glamorous, this type of work is necessary to enable more complicated features like better sharing or fine-grained user permissions. Here is a quick look at the before and after:

#### Before

![Asset navigation component before changes](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/f2e71206539ecaff5288d7e31d9a249d.webp)

#### After

![Asset navigation component after changes](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/580cc9a8d4bda6a8334045547ebb4bdf.webp)

### @bwees

![The Immich web editor in v2.5.0](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/9b2f686dcf0e1a16a90132a326856aea.webp)

This month I finished up the work needed to get non-destructive editing. The original proof of concept for non-destructive editing was completed all the way back in November of 2025. The last 20% of the work to clean up the implementation, handle edge cases, and test everything took the better part of 2 months to get over the line. I am super proud of this feature and I hope many people find this useful!

There are lots of places in Immich where we assume that assets cannot arbitrarily change. Non-destructive editing changes many parts of the asset including the thumbnails, dimensions, thumbhash, face and OCR bounding boxes, and many more. Every location where that information is accessed needs to be updated to support the edited version. The PR to support image editing was 8000+ lines and took an additional 12+ PRs to fully support editing across Immich.

![An early iteration of the new immich mobile editor](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/6d9a184514f4badf8f9d89c8aa88a21f.webp)

During the later part of January I focused on getting the mobile editor updated as well as adding image filter support. These changes were surprisingly trivial as much of the architecture had been updated to support image edits. I hope to get these features out in the near future to complete editing experience.

There are currently quite a few limitations on non destructive editing. Most of them revolve around lacking editing support on videos. My next steps will be porting editing to support editing via [ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html). With this support, I should be able to unlock live photo support and have a base for further video editing features in the future.

I did manage to "break prod" for the first time as an Immich team member with version 2.5.0! Fortunately, the failure mode was quite benign with videos showing at an improper aspect ratio. The fix for this was actually quite complex and involved a 4 hour call with many team members to fix. I am grateful for working with a supportive and caring team that is willing to jump in the trenches and help out :grinning:!

## Upcoming goals

Looking forward to February we hope to continue work on Workflows, which we introduced [back in November](/blog/2025-november-recap). Also, I imagine there will be some issues & other feedback from the recently released features that will likely try to incorporate into the application. Related, the number of pull requests and issues have [continued to increase](https://data.immich.app/), so the team will probably try to get those both down to manageable numbers again.

![Graph of open pull requests over time](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/6d02197684c4ba4a1d5bf17626e87ece.webp)

![Graph of open issues over time](https://static.immich.cloud/blog/fe82bb73-0959-4867-a669-4de0f21a0e91/f3fd1e7b96825b7f1da11f852e4b6766.webp)

\
Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
