---
authors: [Immich Team]
description: Release notes for v2.3.0 — OCR improvements, synchronizing deletes on
  android, feature sneak peeks, and more!!
id: 798e74f4-a2ef-40d9-915f-6452d4162723
publishedAt: 2025-11-19
slug: v2.3.0-release
title: Release v2.3.0
---

_Loa loa loa, the stock is running low on_ [_Retro DVD _](https://immich.store/products/immich-retro)**\*📀\*\***! If you want to get one for yourself, you still can, but once this batch is gone, we won't be making any more, **EVER!** So get one while you can from* [*immich.store*](https://immich.store/)*!\*

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/bc2d474202aa75e83ad36a7dc13cd77f.webp)

## Highlights

Welcome to the release `v2.3.0` of Immich. This version comes with enhancements to the OCR feature and many bug fixes. This release also introduces foundational support for workflows and an application restore mechanism directly in the web UI. Let's dive into some of the highlights below

- OCR Improvements
- Add/move action in mobile app
- Delete synchronization - Android
- Notable fixes: app freezes on resume on iOS
- Sneak peek: Maintenance mode and workflow

### Add/move action in mobile app

The asset viewer in the mobile app now includes an "Add to" button that lets you quickly add an asset to an album, the locked folder, or the archive. Thanks @happychriss!

![Tapping the "Add to" button presents a menu to add/move an asset](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/26ccc102d4a8c979f7a272f5ad00c4b7.webp)

### OCR Improvement

This release includes several enhancements to the OCR feature. There are now language-specific OCR model variants, extending support to Greek, Korean, Russian, Belarusian, Ukrainian, Thai, and languages using the Latin script. All variants (including the existing models) support English as well. There is also an English-only model that performs better for libraries where multilingual support is not needed.

To switch to one of these models, you can navigate to the [OCR settings](https://my.immich.app/admin/system-settings?isOpen=machine-learning+ocr), choose the relevant model, save, then re-run OCR on all assets through the [Job Status](https://my.immich.app/admin/jobs-status) page.

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/23baebfce2a046200557f057cb3841ce.webp)

The OCR information can now be viewed by toggling a button in the web viewer. You can hover the mouse over the text and copy it.

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/4514ab9b246dc584e15ab46bda9869ca.webp)

### Delete synchronization on Android.

This release restores the previous mechanism for synchronizing the deletion action between the web and the mobile app. In addition to putting the asset in Immich's trash bin, the mechanism also puts the deleted asset in the device's trash system when the app opens. The mechanism has been reworked to align with the new data sync mechanism in the mobile app. You can enable the mechanism in the `App Settings > Advanced > Sync Remote Deletions`

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/cd17fece0b6138afb50ae57f21eb739f.webp)

### Notable fixes: app freezes on resume on iOS

Previously, iOS background tasks, such as local or remote data sync and background uploads, could abruptly terminate database operations when the iOS's background time expires, leaving the database lock unreleased. It leads to an annoying symptom: the app appears to freeze when opening from the background, requiring a hard restart (swipe up to close, then reopen) to regain access to the database. The bug happened sporadically and was incredibly hard to track down. Thanks to the relentless pursuit of the bug, we believe it has been caught through our extensive testing. Please let us know if you are still getting "bugged" by this one in the new version.

### Sneak peek: Maintenance mode and workflow

We can't contain the excitement to share two exciting items in the work, which have some portions already merged into the server, and are ready to be built upon

#### Maintenance mode

This mode will allow the admin to put the server into a state where no one can access it without entirely shutting it down. This paves the way for restoring the server from a previous point in time directly from the web UI, no more fidgeting with the terminal.

<video-here>

#### Workflow

The foundation of workflows and plugins also made its way to the server; the UI is being worked on. This feature will enable many more custom use cases that are not available in the core application. The community can write custom plugins and share them. We are very excited to see this happening faster than anticipated. Below is a screenshot of how the feature could look.

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/643689df9875092b673d4198b41b35cf.webp)

![](https://static.immich.cloud/blog/798e74f4-a2ef-40d9-915f-6452d4162723/261f5d6aed41d97fecd9523cca8ca8bf.webp)

## What's Changed

### 🚀 Features

- feat: Add random memories resource by @jpg0 in <https://github.com/immich-app/immich/pull/20025>
- feat(mobile): Quick date picker in the search page by @exelix11 in <https://github.com/immich-app/immich/pull/22653>
- feat: workflow foundation by @alextran1502 in <https://github.com/immich-app/immich/pull/23621>
- feat(mobile): add to album from asset viewer by @happychriss in <https://github.com/immich-app/immich/pull/23608>
- feat: maintenance mode by @insertish in <https://github.com/immich-app/immich/pull/23431>
- feat(mobile): location edit from asset viewer by @bwees in <https://github.com/immich-app/immich/pull/23925>
- feat: timeline e2e tests by @midzelis in <https://github.com/immich-app/immich/pull/23895>
- feat: show OCR bounding box by @alextran1502 in <https://github.com/immich-app/immich/pull/23717>

### 🌟 Enhancements

- fix(web): add URLs to results in large files utility by @Snowknight26 in <https://github.com/immich-app/immich/pull/23617>
- feat(ml): add preload and fp16 settings for ocr by @mertalev in <https://github.com/immich-app/immich/pull/23576>
- feat(ml): multilingual ocr by @mertalev in <https://github.com/immich-app/immich/pull/23527>
- feat(mobile): Show lens model information in the asset viewer detail panel by @fabianbees in <https://github.com/immich-app/immich/pull/23601>
- feat: lazy load thumbnails on people and place list by @lukashass in <https://github.com/immich-app/immich/pull/23682>
- feat: make memories slideshow duration configurable by @meesfrensel in <https://github.com/immich-app/immich/pull/22783>
- feat(mobile): chat-style for asset activity view by @idubnori in <https://github.com/immich-app/immich/pull/23347>
- feat: show update version info by @alextran1502 in <https://github.com/immich-app/immich/pull/23698>
- feat(mobile): album activity deep link by @idubnori in <https://github.com/immich-app/immich/pull/23737>
- feat(web): animate gifs on hover by @meesfrensel in <https://github.com/immich-app/immich/pull/23198>
- feat(web): disable searching by disabled features by @meesfrensel in <https://github.com/immich-app/immich/pull/23798>
- feat: library details page by @danieldietzler in <https://github.com/immich-app/immich/pull/23908>
- feat(web): always view original of animated images by @meesfrensel in <https://github.com/immich-app/immich/pull/23842>
- feat: add originalPath for external library assets in dedupe by @kprkpr in <https://github.com/immich-app/immich/pull/23710>

### 🐛 Bug fixes

- feat: exif medium tests by @jrasm91 in <https://github.com/immich-app/immich/pull/23561>
- fix(web): fix timezone dropdown for timestamps lacking milliseconds by @skatsubo in <https://github.com/immich-app/immich/pull/23615>
- fix(web): "select all" button in trash and permanently deleted count by @Yonyc in <https://github.com/immich-app/immich/pull/23594>
- fix: fully sync local library on app restart by @alextran1502 in <https://github.com/immich-app/immich/pull/23323>
- fix: check if unmetered instead of wifi by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23380>
- fix(mobile): Add fade-in to asset viewer transition by @goalie2002 in <https://github.com/immich-app/immich/pull/23692>
- fix(web): i18n for admin>users>sessions by @meesfrensel in <https://github.com/immich-app/immich/pull/23756>
- feat: opt-in sync of deletes and restores from web to Android (beta timeline) by @PeterOmbodi in <https://github.com/immich-app/immich/pull/20473>
- fix(mobile): Set dynamic height of actions row in BottomSheet by @vitoksmile in <https://github.com/immich-app/immich/pull/23755>
- fix(mobile): Hide download button in asset viewer "immersive mode" by @goalie2002 in <https://github.com/immich-app/immich/pull/23720>
- fix(mobile): sync album and asset activity state when add/remove asset level activity by @idubnori in <https://github.com/immich-app/immich/pull/23484>
- fix(server): properly handle HEAD requests to SSR paths by @dav-wolff in <https://github.com/immich-app/immich/pull/23788>
- fix(web): make sliding window cover all visible space to show small number of assets by @meesfrensel in <https://github.com/immich-app/immich/pull/23796>
- refactor: shared links modals by @danieldietzler in <https://github.com/immich-app/immich/pull/23803>
- chore: bump background_downloader by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23839>
- fix(server): include the previous year in memories for January 1, 2, 3 by @skatsubo in <https://github.com/immich-app/immich/pull/23832>
- fix: timeline scroll after navigate by @danieldietzler in <https://github.com/immich-app/immich/pull/23664>
- fix: prefer filename from body over path in mime validation by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23810>
- fix(web): keep album timeline when selecting cover by @roadev in <https://github.com/immich-app/immich/pull/23819>
- fix: word wrap on custom link preview by @100daysummer in <https://github.com/immich-app/immich/pull/23942>
- fix(mobile): delete from device warning shows incorrectly by @YarosMallorca in <https://github.com/immich-app/immich/pull/23935>
- fix: deep link to last asset by @midzelis in <https://github.com/immich-app/immich/pull/23920>
- fix: null dereference when canceling bucket in album by @midzelis in <https://github.com/immich-app/immich/pull/23924>
- fix: incorrect header height calculation in estimated month height by @midzelis in <https://github.com/immich-app/immich/pull/23923>
- chore: update drift by @alextran1502 in <https://github.com/immich-app/immich/pull/23877>
- chore: reset remote sync on app update by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23969>
- fix(server): copy relevant panorama tags to preview image by @meesfrensel in <https://github.com/immich-app/immich/pull/23953>
- fix: unarchive action doesn't update archive page by @midzelis in <https://github.com/immich-app/immich/pull/23987>

### 📚 Documentation

- chore: update config.json example by @bo0tzz in <https://github.com/immich-app/immich/pull/23471>
- fix(docs): bump docs for PG versions by @mmomjian in <https://github.com/immich-app/immich/pull/23714>
- feat: endpoint descriptions by @jrasm91 in <https://github.com/immich-app/immich/pull/23813>
- feat: endpoint versioning by @jrasm91 in <https://github.com/immich-app/immich/pull/23858>
- chore: include link to discord server when referencing contribution channel by @Hritik14 in <https://github.com/immich-app/immich/pull/23728>
- fix(docs): update Readme links by @mmomjian in <https://github.com/immich-app/immich/pull/23959>

## New Contributors

- @FreeWind6 made their first contribution in <https://github.com/immich-app/immich/pull/23627>
- @Yonyc made their first contribution in <https://github.com/immich-app/immich/pull/23594>
- @fabianbees made their first contribution in <https://github.com/immich-app/immich/pull/23601>
- @exelix11 made their first contribution in <https://github.com/immich-app/immich/pull/22653>
- @AlexanderS made their first contribution in <https://github.com/immich-app/immich/pull/23838>
- @Hritik14 made their first contribution in <https://github.com/immich-app/immich/pull/23728>
- @roadev made their first contribution in <https://github.com/immich-app/immich/pull/23819>
- @zebrapurring made their first contribution in <https://github.com/immich-app/immich/pull/22145>
- @happychriss made their first contribution in <https://github.com/immich-app/immich/pull/23608>
- @insertish made their first contribution in <https://github.com/immich-app/immich/pull/23948>
- @100daysummer made their first contribution in <https://github.com/immich-app/immich/pull/23942>
- @kprkpr made their first contribution in <https://github.com/immich-app/immich/pull/23710>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.2.3...v2.3.0>

---
