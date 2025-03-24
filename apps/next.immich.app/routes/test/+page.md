---
layout: blog
author: jrasm91
createdAt: 2022-03-16
---

# h1

## h2

### h3

#### h4

##### h5

```ts
const foo = 'bar';
```

# v1.129.0

Welcome to release `v1.129.0` of Immich. The road-to-stable is bumpy, but at least, we have _made memories_ together with the recent changes and issues with the new memories implementation :yum:. We owe you an explanation for the changes. Please find it, along with the highlights of this release below:

- Videos in memories are now playable on the web.
- Shortcuts (`L` and `Shift+L`) to add assets to an album or shared album on the web.
- Fixed an issue where opening Immich pauses playing music on iOS
- The shared link now has a generated QR code for easier sharing.

<p align="center">
<img  src="https://github.com/user-attachments/assets/4e65dcab-c4c8-4394-8d0e-9fcddcc9da59" width="300px" />
</p>

## Memories

Obviously, there have been some bugs related to implementing the new memories. For that, we apologize. We can be better about testing these new features moving forward.

In this release, we’ve added a migration that:

- deletes all previous memories
- resets the memory generation status field
- automatically runs the memory generation job

This should fix all of the memory issues that have happened since `v1.127.0`.

### Future improvements

There are some specific things planned with regard to memories, which this (painful) transition has enabled us to do:

- Adjust/edit memories: the new change makes it possible to add/remove other assets from the memory
- Share memories: memories can hopefully soon have a shared-link implementation similar to albums
- More types of memories: based on location, people, date ranges, events, etc.
- View past memories: on-this-day memories are cool, and now we have the data saved to let you browse memories from yesterday, last week, or tomorrow.

### More technical details

There has been a lot of confusion around memories over the last few days that we wanted to clear up. Here are some important details:

- In `v1.127.0`, memories transitioned from a single on-the-fly database query to a background job
- The new job runs nightly and generates memories for several days in the future
- After updating, there were no memories because the job hadn’t run yet
- The job can be manually run via `Admin > Jobs > Create Job > Memory Generation`
- There is a metadata table that tracks what days memories have already been generated for and skips those days the next time it runs
- Memories that aren’t marked as favorite will be deleted after 30 days
- This delete process is also a job that can be run manually. It’s called `Memory Cleanup`

Unfortunately, there were two main bugs that wreaked havoc on memories:

- An “off by one bug”, that resulted in the memories being generated twice for the same day
- A bug with the “years ago” calculation. It turns out that the "single database query” was broken when used for anything other than “today”. E.g., generating a memory for tomorrow would result in “0 years”

Both bugs were fixed in `v1.128.0`, but because memories are pre-generated, the broken ones still existed and were being used. The “Cleanup” job doesn’t delete pre-existing memories until they’re 30 days old. Even if they were manually removed, the “memory status field” would prevent those days from being regenerated anyway. These issues should now be fixed in this release, which essentially resets everything memory-related back to 0.

## Support Immich

<p align="center">

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjY2eWc5Y2F0ZW56MmR4aWE0dDhzZXlidXRmYWZyajl1bWZidXZpcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/87CKDqErVfMqY/giphy.gif" width="450" title="SUPPORT THE PROJECT!">

</p>

If you find the project helpful, you can support Immich by purchasing a product key at https://buy.immich.app or purchase our merchandise at https://immich.store

## What's Changed

### 🚀 Features

- feat: partner sync by @zackpollard in <https://github.com/immich-app/immich/pull/16424>

### 🌟 Enhancements

- feat(server): Shortened asset ID in storage template by @mmomjian in <https://github.com/immich-app/immich/pull/16433>
- feat: add album keyboard shortcuts by @knechtandreas in <https://github.com/immich-app/immich/pull/16442>
- feat(server): library cleanup from ui by @etnoy in <https://github.com/immich-app/immich/pull/16226>
- feat(web): Video memories on web by @YarosMallorca in <https://github.com/immich-app/immich/pull/16500>
- feat(cli): watch paths for auto uploading daemon by @eligao in <https://github.com/immich-app/immich/pull/14923>
- feat: QR code for new shared link by @zackpollard in <https://github.com/immich-app/immich/pull/16543>

### 🐛 Bug fixes

- fix(web): unable to download live photo as anonymous user by @Mikayex in <https://github.com/immich-app/immich/pull/16455>
- fix(web): Fixed people list overflowing in advanced search by @YarosMallorca in <https://github.com/immich-app/immich/pull/16457>
- fix(mobile): Updated formatting of server address in networking by @YarosMallorca in <https://github.com/immich-app/immich/pull/16483>
- fix: don't use public keyword in migration query by @alextran1502 in <https://github.com/immich-app/immich/pull/16514>
- fix(web): delete action from full-screen reset view port in gallery view by @abaroni in <https://github.com/immich-app/immich/pull/15469>
- fix: reset/regenerate memories by @jrasm91 in <https://github.com/immich-app/immich/pull/16548>
- fix(server): fix import path truthiness check by @etnoy in <https://github.com/immich-app/immich/pull/16570>
- fix(mobile): incorrect memories with timezone by @alextran1502 in <https://github.com/immich-app/immich/pull/16562>
- fix(server): check updateLibraryIndex for zero by @etnoy in <https://github.com/immich-app/immich/pull/16585>
- fix(mobile): do not pause audio on app start by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/16596>
- feat(server): e2e for missing jobs by @etnoy in <https://github.com/immich-app/immich/pull/15910>
- fix(mobile): .well-known usage by @waclaw66 in <https://github.com/immich-app/immich/pull/16577>
- fix(web): fix lost scrollpos on deep link to timeline asset, scrub stop by @midzelis in <https://github.com/immich-app/immich/pull/16305>
- fix: isar crash on resume from app detach by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/16599>
- fix: storage template failure after re-upload and previous fail by @zackpollard in <https://github.com/immich-app/immich/pull/16611>

### 📚 Documentation

- docs: Better Facial Recognition Clusters by @aviv926 in <https://github.com/immich-app/immich/pull/14911>
- fix(docs): info on preloading ML models by @mmomjian in <https://github.com/immich-app/immich/pull/16452>
- docs: clean up environment variables formatting & grammar by @kofi-bhr in <https://github.com/immich-app/immich/pull/16555>
- docs: 60k stars! ⭐ by @danieldietzler in https://github.com/immich-app/immich/pull/16618

### 🌐 Translations

- fix(web): Update menu titles to be more consistent by @Snowknight26 in <https://github.com/immich-app/immich/pull/16558>
- feat(mobile): Added translations for Catalan by @YarosMallorca in <https://github.com/immich-app/immich/pull/16616>

## New Contributors

- @Mikayex made their first contribution in <https://github.com/immich-app/immich/pull/16455>
- @lusu007 made their first contribution in <https://github.com/immich-app/immich/pull/16470>
- @knechtandreas made their first contribution in <https://github.com/immich-app/immich/pull/16442>
- @jrcichra made their first contribution in <https://github.com/immich-app/immich/pull/16513>
- @abaroni made their first contribution in <https://github.com/immich-app/immich/pull/15469>
- @kofi-bhr made their first contribution in <https://github.com/immich-app/immich/pull/16555>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v1.128.0...v1.129.0>
