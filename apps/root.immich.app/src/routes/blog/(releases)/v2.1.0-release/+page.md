---
authors: [Immich Team]
description: Release notes for v2.1.0 — coming back from a successful stable release
  with some nice enhancements and bug fixes!
id: cf71f495-d6d9-4658-95cc-7623d2045ebf
publishedAt: 2025-10-15
slug: v2.1.0-release
title: Release v2.1.0
---

Welcome to release `v2.1.0` of Immich!

It's been about 2 weeks since our [stable release](/blog/v2.0.0-release) :tada: and the celebratory [Retro DVD](https://immich.store/products/immich-retro) :dvd:, which many of you are starting to receive. For those outside the US still waiting for theirs, we're currently awaiting a new batch of DVDs. Hopefully, those start shipping early next week at the latest.

We'd like to take a moment to thank everyone for the support, kind words, and otherwise positive feedback. It's been great to hear, and it means more to us than you know :hearts:.

## Highlights

This release contains mostly bug fixes, with a few minor enhancements. Here are some of the highlights:

- Improved slideshow shuffle order (web)
- Edit seconds and milliseconds (web)
- Upload to stack (web)
- Local album event notifications (web)
- Notable fix: mobile search page scrolls back to the top

As always, this release also contains the latest [translations](https://hosted.weblate.org/projects/immich/immich/).

### Improved slideshow shuffle order (web)

This release improves on the algorithm used to implement the `Shuffle` order for the slideshow feature on the web. You should now see a better distribution of photos (fewer repeats).

![](https://static.immich.cloud/blog/cf71f495-d6d9-4658-95cc-7623d2045ebf/3b76b1199b65aceb6b8a35a246667fd9.webp)

### Edit seconds and milliseconds (web)

The change date modal on the web now supports the option to specify seconds and milliseconds.

![](https://static.immich.cloud/blog/cf71f495-d6d9-4658-95cc-7623d2045ebf/08c941ced114a6d95ad99c5b0c4ddaf6.webp)

### Upload to stack (web)

For stacks, a new menu option has been added: `Add upload to stack`. This action will open a file picker, allowing you to upload directly to the stack.

![](https://static.immich.cloud/blog/cf71f495-d6d9-4658-95cc-7623d2045ebf/664eee99680677ff935772e319ce02ef.webp)

### Local album event notifications (web)

This release adds a new in-app notification type: `Shared Album Update`. When a new asset is added to a shared album, all users will receive a notification about the update. You can click on the notification to go directly to the mentioned album.

The foundation for in-app (web) notifications was introduced in #17701, and we're still working on expanding it to include more event types, with the hope of eventually incorporating it into the mobile app as a push notification.

![](https://static.immich.cloud/blog/cf71f495-d6d9-4658-95cc-7623d2045ebf/4c543143aaff9e9fce6b806f5aafa2e1.webp)

### Notable fix: mobile search page scrolls back to the top

The search page on mobile uses "infinite scroll", which means new chunks of assets are automatically loaded in as you scroll down the page. However, prior to this release, the scroll position would reset to the top whenever new chunks were added, resulting in a frustrating user experience. This has been fixed, and the scroll position no longer resets.

## What's Changed

### 🌟 Enhancements

- feat(server): improve checkAlbumAccess query performance by @skatsubo in <https://github.com/immich-app/immich/pull/22467>
- fix(web): do not notify on patch releases by @jrasm91 in <https://github.com/immich-app/immich/pull/22591>
- fix(web): Uniform random distribution during shuffle by @Pascal-So in <https://github.com/immich-app/immich/pull/19902>
- feat(web): seconds and milliseconds in timestamps by @kaziu687 in <https://github.com/immich-app/immich/pull/20337>
- feat(web): Add upload to stack action by @Sese-Schneider in <https://github.com/immich-app/immich/pull/19842>
- feat(server): add `immich.users.total` metric by @Tushar-Harsora in <https://github.com/immich-app/immich/pull/21780>
- feat: local album events notification by @alextran1502 in <https://github.com/immich-app/immich/pull/22817>

### 🐛 Bug fixes

- fix(docs): link to immich docs does not lead correctly to docs by @XavierDupuis in <https://github.com/immich-app/immich/pull/22687>
- fix(server): fix chunking Postgres query parameters by @skatsubo in <https://github.com/immich-app/immich/pull/22684>
- fix(ml): Resolve IPv6 startup crash and healthcheck failure by @CaptainJack2491 in <https://github.com/immich-app/immich/pull/22387>
- fix(server): override reserved color metadata for video thumbnails by @mertalev in <https://github.com/immich-app/immich/pull/22348>
- fix(mobile): trash description cut off by @YarosMallorca in <https://github.com/immich-app/immich/pull/22662>
- fix(mobile): empty album description does not save by @YarosMallorca in <https://github.com/immich-app/immich/pull/22649>
- fix(mobile): video player using ref after disposal by @mertalev in <https://github.com/immich-app/immich/pull/21843>
- fix: missing responsive calculation in UserPageLayout by @midzelis in <https://github.com/immich-app/immich/pull/22455>
- fix: use full-size image for non-web-compatible panoramas by @grgergo1 in <https://github.com/immich-app/immich/pull/20359>
- fix: hide view in timeline button on local timeline by @bwees in <https://github.com/immich-app/immich/pull/22713>
- fix: Fix issue fail to download iOS live photos by @CuberL in <https://github.com/immich-app/immich/pull/22708>
- fix(mobile): closing editor goes back to main page by @YarosMallorca in <https://github.com/immich-app/immich/pull/22647>
- fix: improve the selected sidebar item text color in dark mode by @alextran1502 in <https://github.com/immich-app/immich/pull/22640>
- fix: promote to foreground service before starting engine by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22517>
- fix: bottom sheet blank with local assets that have remote counterparts by @bwees in <https://github.com/immich-app/immich/pull/22743>
- fix: skip local only assets in move to lock action by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22728>
- fix: brief flashing when swiping from video by @Saschl in <https://github.com/immich-app/immich/pull/22187>
- fix: persist search page scroll offset between rebuilds by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22733>
- fix: only cast to device if the asset is a RemoteAsset by @bwees in <https://github.com/immich-app/immich/pull/22805>
- fix: ios skip posting hash response after detached from engine by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22695>
- fix: shared album control permissions by @bwees in <https://github.com/immich-app/immich/pull/22435>
- fix: show dialog before delete local action by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22280>
- chore: refactor show view in timeline button by @bwees in <https://github.com/immich-app/immich/pull/22894>

### 📚 Documentation

- docs: update Synology install guide by @TDR001 in <https://github.com/immich-app/immich/pull/21996>
- docs: add some external library notes by @jrasm91 in <https://github.com/immich-app/immich/pull/22776>
- docs: add Immich-Stack to community-projects by @Qhilm in <https://github.com/immich-app/immich/pull/21563>

### 🌐 Translations

- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/22623>

## New Contributors

- @XavierDupuis made their first contribution in <https://github.com/immich-app/immich/pull/22687>
- @adrianjost made their first contribution in <https://github.com/immich-app/immich/pull/22631>
- @CaptainJack2491 made their first contribution in <https://github.com/immich-app/immich/pull/22387>
- @USBAkimbo made their first contribution in <https://github.com/immich-app/immich/pull/22673>
- @MontejoJorge made their first contribution in <https://github.com/immich-app/immich/pull/22702>
- @diogotcorreia made their first contribution in <https://github.com/immich-app/immich/pull/21602>
- @CuberL made their first contribution in <https://github.com/immich-app/immich/pull/22708>
- @TDR001 made their first contribution in <https://github.com/immich-app/immich/pull/21996>
- @PeterDaveHello made their first contribution in <https://github.com/immich-app/immich/pull/22703>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.0.1...v2.1.0>
