---
authors: [Immich Team]
description: Release notes for v2.2.0 — v2 stable docker tag, OCR, an even faster
  justified layout implementation on web, various features that are now on mobile,
  and more!!
id: 2c257fa0-5605-472c-a08b-7617de2dacb4
publishedAt: 2025-10-30
slug: v2.2.0-release
title: Release v2.2.0
---

_The month following our_ [_stable release _](/blog/v2.0.0-release)**_🎉_** _has flown by! We are blown away by the support from everyone around this milestone, especially for the_ [_Retro DVD _](https://immich.store/products/immich-retro)**\*📀\*\***! If you want to get one for yourself, you still can, but once this batch is gone, we won't be making any more, **EVER!** So get one while you can from* [*immich.store*](https://immich.store/)*!\*

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/bc2d474202aa75e83ad36a7dc13cd77f.webp)

## Highlights

Welcome to version `v2.2.0` of Immich. This release comes with the traditional Immich fashion, where the features and enhancements list is longer than the bug fixes list. Let's dive right into the highlights of this exciting release

- New mutable Docker tag for `v2` versions
- Optical Character Recognition (OCR)
- \[Web\] WASM implementation for justified layout calculation 🦀
- \[Web\] UI improvement for the review duplicates screen
- \[Mobile\] Show albums in the asset's detail sheet
- \[Mobile\] Show similar photos
- \[Mobile\] Chat-style for activity view
- \[Mobile\] High precision seeking for video
- \[Mobile\] New UI to present server-client version mismatch
- Option to create a new user as an admin
- Notable fix: older iOS devices freeze when spawning background tasks
- Notable fix: temporary files on iOS are now cleaned up properly

### Docker tag for `v2` versions

The `example.env` file has been updated to use `IMMICH_RELEASE=v2`, which is a mutable Docker tag that points to the latest `2.x.x` release image.

### Optical Character Recognition (OCR)

OCR search has been one of the most requested features on our users' wishlists. Thanks to the fantastic work of @flipped-1121 and @mertalev, Immich can now recognize texts in images, adding a powerful capability to its already powerful search features. This will help users find lost family recipes or a crypto wallet's passphrase more easily.

The OCR pipeline is integrated into the existing machine learning flow. For new uploads, it will run automatically with the existing machine learning flow. For existing setups, you can go to `Administration > Job > Click on "All" for OCR job` to extract OCR information for your gallery

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/c1ecf308e41b2ddce9ed342b20770ed7.webp)

To search for letters in photos, a new radio button has been added to the search type on the web app, and in the dropdown list on the mobile app.

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/c5e26338e4e6d68f8a4ac3723ae8b70f.webp)

### \[Web\] WASM implementation for justified layout calculation 🦀

This release comes with a blazing-fast re-implementation of the justified layout on the web, which makes calculating the size of the thumbnails in each bucket several times faster, significantly improving the rendering performance for a large bucket, i.e., 10s of thousands of assets in a single month

### \[Web\] UI improvement for the review duplicates screen

To help you decide which asset to keep in a group of duplicates, more information has been added to the info section below each asset, including date/time, location, and the number of albums the asset is in. The info section has been redesigned to make scanning the information faster, with different properties getting highlighted. We will keep improving on this interface to make it more intuitive

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/e62e4ba82985f795af706374e81281f0.webp)

### \[Mobile\] Show albums in the asset's detail sheet

You can view and navigate to the albums that the asset belongs to in the info sheet

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/c606960b670aabf3cd6c0393d4e47035.webp)

### \[Mobile\] Show similar photos

The popular feature "Show similar photos" has made its way to the mobile app. You can use the button in the detail sheet to find similar images to the one you are viewing.

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/92082f99d45167381e0db8c9eb48fcde.webp)

### \[Mobile\] Chat-style for album activity view

The album's activity view now displays the messages and actions in a chat-style view, making it easier to follow

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/88e659e79be7f4469d20d51b61a2739a.webp)

### \[Mobile\] High precision seeking for video

The progress bar of the video player now has higher precision duration handling. This makes seeking much more fluid than before, as well as making position updates in the progress bar smooth, rather than jumping from second to second.

### \[Mobile\] New UI to present server-client version mismatch

As we are now in the stable-era, we want to make the notification of a new version more subtle, less distracting. The update message and icon's color on the mobile app have been redesigned for that purpose.

When your server version is older than the available one, a message with a clickable link is displayed, directing you to the latest release notes.

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/810a2d2125aeb86ac2bcb6b66f8c4cc7.webp)

When your mobile app version is older than the one available on the App Store, a message with a clickable link appears, directing you to the App Store to perform the update.

![](https://static.immich.cloud/blog/2c257fa0-5605-472c-a08b-7617de2dacb4/bd14a6bc918d3dabe41d24e8ccf3612b.webp)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed

### 🔒 Security

- fix(server): bump valkey to 8 by @mmomjian in <https://github.com/immich-app/immich/pull/22911>

### 🚀 Features

- feat(ml): coreml by @mertalev in <https://github.com/immich-app/immich/pull/17718>
- feat(server): Option to configure SMTPS transport by @clementmartin in <https://github.com/immich-app/immich/pull/22833>
- feat: show location & date on duplicate asset comparison overview by @adrianjost in <https://github.com/immich-app/immich/pull/22632>
- feat: view the user's app version on the user page by @aviv926 in <https://github.com/immich-app/immich/pull/21345>
- feat: GHA for iOS release flow by @alextran1502 in <https://github.com/immich-app/immich/pull/23196>
- feat(web): add search filter for camera lens model. by @dagstuan in <https://github.com/immich-app/immich/pull/21792>
- feat(web): load original videos by @andre-antunesdesa in <https://github.com/immich-app/immich/pull/20041>
- feat(cli): add --delete-duplicates option by @RobinJ1995 in <https://github.com/immich-app/immich/pull/20035>
- feat: ocr by @flipped-1121 in <https://github.com/immich-app/immich/pull/18836>
- feat: show "appears in" albums on asset viewer bottom sheet by @bwees in <https://github.com/immich-app/immich/pull/21925>
- feat: getAssetOcr endpoint by @alextran1502 in <https://github.com/immich-app/immich/pull/23331>
- feat(mobile): view similar photos by @vitoksmile in <https://github.com/immich-app/immich/pull/22148>
- feat(mobile): chat-style album activities timeline by @idubnori in <https://github.com/immich-app/immich/pull/23185>

### 🌟 Enhancements

- feat(album): show per-user contributions in shared albums by @Chaoscontrol in <https://github.com/immich-app/immich/pull/21740>
- feat: add video auto play setting by @Saschl in <https://github.com/immich-app/immich/pull/20416>
- fix(web): improve scrubber behavior on scroll-limited timelines by @midzelis in <https://github.com/immich-app/immich/pull/22917>
- feat(web): Download links and Obtainium link generator on Utilities page and onboarding by @NicholasFlamy in <https://github.com/immich-app/immich/pull/20589>
- feat(web): create user as admin by @jrasm91 in <https://github.com/immich-app/immich/pull/23026>
- chore: rework backup success notification descriptions by @bwees in <https://github.com/immich-app/immich/pull/23024>
- feat(mobile): Change the UI of asset activity list to bottom sheet by @idubnori in <https://github.com/immich-app/immich/pull/23075>
- feat: improved update messaging on app bar server info by @bwees in <https://github.com/immich-app/immich/pull/22938>
- refactor(web): improve date labels in scrubber by @midzelis in <https://github.com/immich-app/immich/pull/23046>
- feat: support database dumps for pg18 by @zackpollard in <https://github.com/immich-app/immich/pull/23186>
- feat: improvements of thumbnail animations by @Lauritz-Tieste in <https://github.com/immich-app/immich/pull/20300>
- feat(web): reactively update shared link expiration by @khanbasharat3a1 in <https://github.com/immich-app/immich/pull/22274>
- feat: (mobile) open asset viewer from album activity page by @idubnori in <https://github.com/immich-app/immich/pull/23182>
- feat(mobile): high precision seeking by @mertalev in <https://github.com/immich-app/immich/pull/22346>
- feat(web): wasm justified layout, sync edition by @mertalev in <https://github.com/immich-app/immich/pull/23194>
- feat: logout sessions on password change by @MontejoJorge in <https://github.com/immich-app/immich/pull/23188>
- feat(server): enhance metadata reading for video files by @tstachl in <https://github.com/immich-app/immich/pull/23258>
- feat: improve UI for resolving duplication detection by @alextran1502 in <https://github.com/immich-app/immich/pull/23145>
- feat: toasts by @jrasm91 in <https://github.com/immich-app/immich/pull/23298>
- feat: asset copy by @danieldietzler in <https://github.com/immich-app/immich/pull/23172>

### 🐛 Bug fixes

- fix(web): prevent photo-only memories showing mute button by @meesfrensel in <https://github.com/immich-app/immich/pull/22802>
- fix: get all assets for the Recents album on iOS by @alextran1502 in <https://github.com/immich-app/immich/pull/22956>
- fix: tag clean up query and add tests by @MontejoJorge in <https://github.com/immich-app/immich/pull/22633>
- fix: unit overlapses value in server stats card by @alextran1502 in <https://github.com/immich-app/immich/pull/22994>
- fix: navigate to time action by @midzelis in <https://github.com/immich-app/immich/pull/20928>
- fix: remove assets from shared link by @MontejoJorge in <https://github.com/immich-app/immich/pull/22935>
- fix(server): only asset owner should see favorite status by @pwojtaszko in <https://github.com/immich-app/immich/pull/20654>
- fix(web): render context overlays over the scrollbar by @PaulSonOfLars in <https://github.com/immich-app/immich/pull/23007>
- fix(web): two scrollbars in folder view by @YarosMallorca in <https://github.com/immich-app/immich/pull/23045>
- fix: skip ML availability check if ML is disabled by @bo0tzz in <https://github.com/immich-app/immich/pull/23053>
- chore: skip dialog for single merged asset by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/22958>
- fix(mobile): notate experimental network features, cleanup mis assigned translation tags by @mmomjian in <https://github.com/immich-app/immich/pull/23021>
- fix(ml): pin cudnn version by @mertalev in <https://github.com/immich-app/immich/pull/23110>
- fix(server): use GPSLongitudeRef and GPSLatitudeRef EXIF fields by @ruippeixotog in <https://github.com/immich-app/immich/pull/21445>
- fix: allow editing all images by @bwees in <https://github.com/immich-app/immich/pull/23144>
- fix: isolate freeze app on older ios device by @alextran1502 in <https://github.com/immich-app/immich/pull/22509>
- fix: android skip posting hash response after detached from engine by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23192>
- fix: back/forward navigation won't reset scroll in timeline by @midzelis in <https://github.com/immich-app/immich/pull/22838>
- fix: handle null bucketId or name in android local sync by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23224>
- fix: fetch original name before upload by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/21877>
- fix: focus-trap on safari by @midzelis in <https://github.com/immich-app/immich/pull/23246>
- fix(web): disable picture-in-picture on video viewer by @tstachl in <https://github.com/immich-app/immich/pull/23318>
- fix: make hitbox on app bar dialog bigger by @bwees in <https://github.com/immich-app/immich/pull/23316>
- fix: clear temp cache on iOS before uploads by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23326>

### 📚 Documentation

- fix(web): clarify some transcoding settings by @meesfrensel in <https://github.com/immich-app/immich/pull/22797>
- docs: fix small error by @0xflotus in <https://github.com/immich-app/immich/pull/22890>
- docs: Expand on OpenVINO WSL HW accel by @Mraedis in <https://github.com/immich-app/immich/pull/21054>
- docs: clarify well-known usage by @jrasm91 in <https://github.com/immich-app/immich/pull/23018>
- feat: move community projects and guides to immich-aweseome by @jrasm91 in <https://github.com/immich-app/immich/pull/23016>
- fix(docs): cli upload json format example by @leepeuker in <https://github.com/immich-app/immich/pull/22858>
- docs: update [backup-and-restore.md](http://backup-and-restore.md) by @nickwebcouk in <https://github.com/immich-app/immich/pull/21065>

## New Contributors

- @Chaoscontrol made their first contribution in <https://github.com/immich-app/immich/pull/21740>
- @meesfrensel made their first contribution in <https://github.com/immich-app/immich/pull/22802>
- @0xflotus made their first contribution in <https://github.com/immich-app/immich/pull/22890>
- @clementmartin made their first contribution in <https://github.com/immich-app/immich/pull/22833>
- @leepeuker made their first contribution in <https://github.com/immich-app/immich/pull/22858>
- @nickwebcouk made their first contribution in <https://github.com/immich-app/immich/pull/21065>
- @idubnori made their first contribution in <https://github.com/immich-app/immich/pull/23075>
- @ruippeixotog made their first contribution in <https://github.com/immich-app/immich/pull/21445>
- @Nykri made their first contribution in <https://github.com/immich-app/immich/pull/22888>
- @slagiewka made their first contribution in <https://github.com/immich-app/immich/pull/23130>
- @khanbasharat3a1 made their first contribution in <https://github.com/immich-app/immich/pull/22274>
- @andre-antunesdesa made their first contribution in <https://github.com/immich-app/immich/pull/20041>
- @RobinJ1995 made their first contribution in <https://github.com/immich-app/immich/pull/20035>
- @flipped-1121 made their first contribution in <https://github.com/immich-app/immich/pull/18836>
- @ZacWarham made their first contribution in <https://github.com/immich-app/immich/pull/23275>
- @tstachl made their first contribution in <https://github.com/immich-app/immich/pull/23258>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.1.0...v2.2.0>
