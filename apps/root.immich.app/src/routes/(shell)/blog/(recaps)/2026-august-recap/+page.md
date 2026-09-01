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

August was a busy month for the team. Most notably our interns wrapped up their summer projects and have gone back to their school and homework. Meanwhile the rest of us continue to chip away sharing, search, memories, and bug fixes. Keep reading below for more details on all this and more.

## Bye bye interns! :wave:

We have had three interns over the summer. They have been great and both delivered awesome new features, as well as squashed a bunch of bugs and cleaned things up. Unfortunately, they have to go back to school now. We wish all three the best with your studies and hope to still see you around online. Thanks for the memories!

## Search

Over the last month or two the team has spent some time redesigning the search for Immich (web). After several iterations this is what we landed on:

![New search modal for Immich (web)](https://static.immich.cloud/blog/cfa80305-6c59-44be-98d2-f52db4c30254/f3e1d6d5e8508dff80c4be179a4868d2.webp)

The main goal is to make the interface more usable and intuitive, without sacrificing some of the powerful features that it had. It is a difficult problem, but we hope this is a step in the right direction. It’ll be rolling out with the `v3.2.0` release later this week. Let us know your thoughts and feedback on the new design.

In other news, “search v2” has been merged into main ([#30179](https://github.com/immich-app/immich/pull/30179)). This is an extension to the current search endpoints, and adds support for combining multiple filters in new ways. In particular, it provides more flexibility around include/excluding sets of values, searching in ranges, and more. Here is a preview of the new API and some of the searches that are possible with it:

```typescript
// assets in both album A and B, but not in C
{ "filter": { "albumIds": { "all": ["A", "B"], "none": ["C"] } } }

// assets with a rating of 3 or more
{ "filter": { "rating": { "gte": 3 } } }

// assets with rating 2 or 4
{ "filter": { "rating": { "in": [2, 4] } } }

// assets with file size between 4–8 GiB
{ "filter": { "fileSizeInBytes": { "gte": 4294967296, "lte": 8589934592 } } }

// assets from album 1 without person 2
{ "filter": { "albumIds": { "any": ["1"] }, "personIds": { "none": ["2"] } } }

// assets with both person 1 and person 2
{ "filter": { "personIds": { "all": ["1", "2"] } } }
```

More changes to search should continue to roll out in the upcoming months. Additionally, 3rd party applications, like photo frames, can start using the new filters immediately.

## Sharing updates

In `v3.2.0` we plan to release _cluster groups_ with the initial goal of enabling users to see their own people and faces in shared assets. Cluster groups are groups of users and these groups will be the basis for people and face sharing in the future. It is worth noting that we have had _several_ failed attempts ([#27236](https://github.com/immich-app/immich/pull/27236), [#27437](https://github.com/immich-app/immich/pull/27437), [#30013](https://github.com/immich-app/immich/pull/30013), and [#30606](https://github.com/immich-app/immich/pull/30606)) trying to implement people and face sharing. It is a complicated problem for sure. However, we think this design is the first step towards delivering on some of the long awaited sharing improvements. Once we finish some more pieces who knows, maybe we’ll even write a dedicated post about the whole process.

![Cluster group user settings](https://static.immich.cloud/blog/cfa80305-6c59-44be-98d2-f52db4c30254/ff2f024fc487bedbc8496d7036c278e4.webp)

### Technical details

Prior to `v3.2.0` the machine learning algorithm could only take a single user’s assets into account while attempting to cluster faces into groups (“people”). With cluster groups, the algorithm can now consider faces and people across all users in the group. More data generally leads to better results, requiring less manual intervention, but the cross-user piece is the most important part in this implementation.

As of right now the only way to benefit from the cluster groups is to re-run facial clustering on the group, which wipes out all people, including names, birthdays, favorite and hidden status, etc for all users in the group. In the future we plan to explore other options to merge per-user clusters in a non-destructive way.

Also, in `v3.2.0` cluster groups only enabled cross user _tracking_ of people and faces. In a future release we hope to enable cross user person _sharing_ and _management_. Where right now you cannot see names or birthdays set by other users, in the future we plan to make name and birthday common properties any user in the group can see and update.

## New release workflow

Until now, shipping a new release always implied a code freeze a little bit before and after the actual release. It turns out this has a significant downside of generally slowing the team’s productivity and throughput during that window. After researching different ways to address this problem we landed on release branches and backporting.

### Release branches

Prior to `v3.2.0` releases were always created from `main`. Now, releases are cut from specific branches like `release/v3.2`, which allows merging to main in tandem with preparing bug fixes for releases.

### Backporting

Everything is still committed to `main`, like it was before. If a commit on `main` needs to be in a release branch it can be _backported_ ([cherry-picked](https://git-scm.com/docs/git-cherry-pick)) to the release branch. This is automatically done via a set of `backport:release/x` GitHub labels. For example, adding the `backport:release/v3.2` label to a PR will automatically cherry pick the bugfix to the `release/v3.2` branch after it is merged.

![Backport label on a GitHub pull request](https://static.immich.cloud/blog/cfa80305-6c59-44be-98d2-f52db4c30254/c17dd1da5bb78258c8b451ebade5dfe9.webp)

In short, now that the release pipeline works with release branches, it is possible to continue development before, during, and after releases. While quite technical, end users should benefit from faster development cycle and receive fast bug fixes as well.

## Roadmap update

The biggest update to the roadmap this month is just the work on people and face sharing via cluster groups, but plan to see more sharing related improvements in the coming months.

## Releases

This month included 2 prereleases for `v3.2.0` which should be released later this week.

- [v3.2.0-rc.1](https://github.com/immich-app/immich/releases#release-v3.2.0-rc.1) - prerelease for `v3.2.0` - new search UI, cluster groups, and memories view
- [v3.2.0-rc.](https://github.com/immich-app/immich/releases#release-v3.2.0-rc.2)2 - prerelease for `v3.2.0` - bug fixes

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

I’ve taken a larger part of this month off for vacation. Having some down time was great, it helped me with spurring new ideas, like how can we make the most out of the photos and videos we have accumulate in each Immich instance, how can we make them more alive, discover about forgotten memories via each photos. The large part sounds like a big data/machine learning projects. I am starting to talk to other team members to see how can we implement such mechanism.

### @jrasm91

This month I spent a decent amount of time migrating about 250 end-to-end (e2e) tests to medium tests. E2e tests require a production stack of Immich to execute and are quite a bit slower to run, harder to developer and validate, and generally more annoying to maintain. So, having them as medium tests is a big win. Also, I helped work on cluster groups, which is the first of many steps towards better sharing.

![Long list of e2e refactor pull requests](https://static.immich.cloud/blog/cfa80305-6c59-44be-98d2-f52db4c30254/be6937e88b8046841d03903aeb5deb4f.webp)

### @danieldietzler

This month, I got to suffer through all of the people clustering PRs you have seen above, in an effort of finding a fitting architecture. It feels great to have finally merged something the whole team feels comfortable about moving forward with. I also helped with both the new search UI as well as the new search API.

FUTO is moving its internal communications from Zulip to Mattermost, and we will also be migrating there (only the team channels!) to streamline our internal communication. After over four years on Discord, we strongly rely on our Discord bot for day-to-day work. So, I also worked on integrating Mattermost into the bot to facilitate migrating for us.

Lastly, as always, there have been many great PRs from the community that needed reviewing, as well as bug fixes and general chores to keep things running smoothly.

### @mertalev

I’ve been working on ML optimizations for most of this month to ease the memory usage requirements and processing time involved. Since Immich is run on a wide range of hardware from Raspberry Pis to mini data centers with different brand GPUs, a challenge has been in making the models run at their best for all of this hardware. For example, what’s best for running a model for AMD GPUs (MIGraphX) can be much slower when running the model on CPU.

Another complication is that many of these changes required re-publishing updated models. If the ML server expected to use these updated models and required a redownload as a result, it would break for users who air-gap their ML container. The code was written to be able to fall back to the old cached models in this case, meaning it can handle running both old and new models.

After a _lot_ of testing and optimizations, the processing time can be up to several times faster while using significantly less memory, the exact results depending on the model and backend. These improvements won’t be in 3.2, but they’ll likely come soon after. As more model tasks are added over time, this should ease the load for those of who did not buy NVIDIA shares.

## Next month

Well, that's it for this month. Next month we hope to work out any kinks with the new workflow process, release branches, and backporting. Also, we plan to continue to iterate on workflows, search, memories, and sharing.

As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>
