---
authors: [Immich Team]
coverAlt: Lake Louise in Alberta, Canada
coverAttribution: Photo by Antoine
coverUrl: https://static.immich.cloud/blog/cfa80305-6c59-44be-98d2-f52db4c30254/062946f173a21c28efc68d5372d3e60c.webp
description: A recap of August, 2026, including an update on upcoming features,
  releases, developer updates, and more.
id: cfa80305-6c59-44be-98d2-f52db4c30254
publishedAt: 2026-08-31
slug: 2026-august-recap
title: August recap
type: recap
---

Hello everyone!

We just released `v3.2` today! Amongst others, it packs a new search API as well as the first item on the long list of sharing improvements we plan to make. Both are foundations for a lot of new features and functionality, and we are excited to have shipped them now. `v3.2.0` was also the first release testing our new release workflow. Ignoring some minor hiccups, it went really well (thanks bo0tzz!).

Let's dive into the details of that, and look at where we are at with new features and our roadmap.

## New release workflow

Until now, shipping a new release always implied a freeze of merging PRs for a couple of days. This was because we wanted to be able to publish patch releases with bug fixes for the latest release, without releasing new PRs we have incidentally merged.

The new pipeline allows us to backport any PR to main to any prior release. That is, as soon as we realized a minor version, we can immediately start merging PRs for the next minor release in. If there happens to be a bug fix we need to release for the prior version, we can simply backport that bug fix and make a new (patch) release for the old version. If you are interested, there will likely be a more technical deep dive of this workflow in the future. So keep an eye out for that!

## Sharing updates

In `v3.2.0` we launched _cluster groups_ that enable users to see their own people in shared assets. Additionally, due to clustering across all users in the group, accuracy will generally also be better. This was one of the primary blockers for sharing enhancements that affect people and we are happy to have finally found a good architectural solution (watch me suffering through [#27236](https://github.com/immich-app/immich/pull/27236), [#27437](https://github.com/immich-app/immich/pull/27437), [#30013](https://github.com/immich-app/immich/pull/30013), and [#30606](https://github.com/immich-app/immich/pull/30606) on the way there).

As of right now, we are aware of one more big blocker for releasing all the sharing improvements. With custom permissions and various ways through which people can acquire access to an asset, the mobile sync becomes exponentially more complicated. It does not seem feasible to try these changes into the way we currently do mobile syncing, so there likely needs to be some refactoring/addition in that area to make it work. You can definitely expect a proper technical write up once this is all done and released.

So, tl;dr we are still a fair bit out from being able to check off the better sharing item from our roadmap, but we are getting there!

## Bye bye interns! :wave:

We have had three interns over the summer. They have been great and both, delivered awesome new features, as well as squashed a bunch of bugs and cleaned things up. Unfortunately, they have to go back to school now. We wish all three of you the best with your studies and hope to still see you around at times. Thanks!

## Roadmap update

## Releases

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

### @jrasm91

### @danieldietzler

## Upcoming goals

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
