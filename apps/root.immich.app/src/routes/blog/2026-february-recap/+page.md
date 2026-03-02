---
authors: [Immich Team]
coverAlt: ''
coverAttribution: Photo by <a href="https://unsplash.com/@v2osk" class="underline">v2osk</a>
  on <a href="https://unsplash.com/photos/foggy-mountain-summit-1Z2niiBPg5A" class="underline">Unsplash</a>
coverUrl: https://static.immich.cloud/blog/dd9fd7aa-2635-49ef-98ff-5f9b157c5a40/9ef436ed0ee5b85bddf8f36734767602.webp
description: A recap of February, 2026, including an update on pull requests, issues, releases, developer updates, and more.
id: dd9fd7aa-2635-49ef-98ff-5f9b157c5a40
publishedAt: 2026-03-02
slug: 2026-february-recap
title: February recap
---

Hello everyone!

It's time for another project update. February was all about pull requests, bug fixes, and other project maintenance. We also had several patch releases. Continue below to read the full recap.

## Pull Requests

Open pull requests on GitHub reached nearly 200 in early February. Since then, we have been (slowly) making our way through them. We know some of the pull requests have been sitting there _for months_, and for that we apologize. We are doing our best though and will hopefully get to them soon. We are a pretty small team after all. We do have this fancy graph however, which shows an overall downward trend.

![](https://static.immich.cloud/blog/dd9fd7aa-2635-49ef-98ff-5f9b157c5a40/c00fce4ec02a2ed0a524c1f61120895f.webp)

## Issues

Similarly, open issues on GitHub was getting pretty close to 600, but the last half of February has seen some major work in that area as well.

![](https://static.immich.cloud/blog/dd9fd7aa-2635-49ef-98ff-5f9b157c5a40/bdedc7e6b32df758d954303776a59cc8.webp)

## Releases

In beginning of February, we had 3 patch releases, bringing the latest version to `v2.5.6`. Since then, there have been over 200 commits on main, and the team is gearing up for another release in the next week or two. Here is a sneak peek of one of the shiny new features: map side panel/timeline (thanks to [michelheusschen](https://github.com/michelheusschen)!)

![](https://static.immich.cloud/blog/dd9fd7aa-2635-49ef-98ff-5f9b157c5a40/a624f8ea59c33ad3d91c222f624ba586.webp)

## New blog post: Building the Immich editor

Since the last recap, we also published a new blog post, which gives a bit of background about the Immich editor that was recently released and some of the technical challenges we ran into while building it.

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

This month has been a month of testing and reviewing PRs. There has been an increasing uptick of contributions and new contributors; most are serious, and some are 100% vibing. I think LLMs are useful, but like any tool, we have to know how to use them effectively. We discussed extensively among ourselves the use of the tool and how best to use our time to handle the situation. If you are curious, you can take a look at the updated [CONTRIBUTION.md docs](https://github.com/immich-app/immich?tab=contributing-ov-file#use-of-generative-ai)

### @jrasm91

Over the last month, I've spent some more time cleaning up actions on the web, similar to what I talked about in the January recap. Besides that, I've been helping other contributors with their work, including an effort to bring editing to mobile, improve the testing experience on mobile, overhaul server tests, and publish `@immich/sql-tools` and `@immich/walkrs` to npm.

### @danieldietzler

In February I have been focused on refactorings and bug fixes. I am excited to say that I finally fixed the longstanding asset update race condition. As soon as an update request returns, it is now ensured that this update will never be lost or overwritten again. This has been especially annoying for 3rd party tools such as immich-go, which send updates immediately after uploading assets to provide additional information found on the file system. Often, these updates were lost, forcing immich-go to pause all job queues while uploading, and then un-pausing them again in a specific order thereafter.

### @bwees

I have been hard at work bringing the new editing experience released in `v2.5.0` to the mobile clients. There is surprisingly a lot of implementation required, including new sync entities on the server and new UI on the mobile app. Here's an early demo of the new experience, enjoy!

<video autoplay controls src="https://static.immich.cloud/blog/dd9fd7aa-2635-49ef-98ff-5f9b157c5a40/443b0530e17dd4cfaf85879f7be5beca.mp4" class="lg:max-w-1/2 mx-auto max-h-[80vh]">Your browser does not support the video tag.</video>

## Upcoming goals

Looking into March, we're planning to remove the old timeline. It's been deprecated ever since the [new sync](https://immich.app/blog/sync-v2) implementation [went stable](https://immich.app/blog/stable-release) back in fall. We are very excited to _finally_ remove all that extra code from the mobile app and unblock some bigger mobile features that we've started work on. Several of us are also excited to travel to Austin, Texas for FUTO's annual [Don't be Evil](https://x.com/FUTO_Tech/status/2024992655109664905) conference. Like last year, we will give a short presentation about the project, talk about what has changed since last year, shiny features, the roadmap, etc.

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
