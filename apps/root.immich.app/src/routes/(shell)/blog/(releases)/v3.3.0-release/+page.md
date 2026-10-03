---
authors: [Immich Team]
description: Release notes for v3.3.0 – People sharing, birthday memories,
  auto-stack edits on mobile, and more!
id: 7f57b1e5-5003-48d9-9207-457ee4b5ff35
publishedAt: 2026-10-05
slug: v3.3.0-release
title: v3.3.0
type: release
---

Welcome to Immich `v3.3.0`!

This release people sharing, birthday memories, and a variety of other features, enhancements, and bug fixes. Keep reading below for a list of highlights.

## Highlights

- Shared people management
- Birthday memories
- Auto-stack edits on mobile
- Sync OAuth claims on every login
- GeoNames for reverse geocoding, allowing for more neutral names of places
- More accurate lighting on re-scaled images
- ML performance and accuracy improvements

### Shared people management

We are very pleased to release the next big milestone towards better sharing: people can now be shared!

Users can share people with you that you don't even own, allowing them to show up in shared assets. Further, it is also possible to update another user's person, if the permission allows so. This aims to address use cases where there are one or two people in a family who want to manage all the people for the rest of the family.

TODO screenshots, but we might be changing the UI until its released

People can only be shared with users within the same cluster group.

### Birthday memories

In an effort of making Immich a bit more joyful to use, we are introducing memories for people's birthdays.

If it's the birthday of a person in your library, Immich will now celebrate that with a special memory featuring previous birthdays.

TODO screenshot/screen recording @[Alex ](mention://b6c29c61-da20-49c9-88d7-85fec5336bd0/user/5e8ebcc1-3d0e-4ced-9ddb-f73f30af4ec0)

### Auto-stack edits (mobile)

When using something other than Immich for editing images on your phone, Immich will now stack those edits on top of the original. This allows for Immich to show all edits in one place, without cluttering the timeline.

This should provide a more organized timeline, especially when you heavily rely on editing assets on your phone.

TODO maybe screenshot? @[Santo Shakil](mention://523a2f8b-ceb0-463b-a731-d90e6f44d291/user/1db259a6-3dee-42c2-83b2-689c349bda60)

### Sync OAuth claims on every login

Immich supports OAuth claims for storage quota, the user role, and the preferred username. Up until now, those were only synced on registration.

Now, they can be synced on every login, allowing you to do active user management through your IDP, updating quotas and roles as you go and as necessary, and Immich will adopt those changes.

### GeoNames for reverse geocoding

We now pull names for places from GeoNames, instead of a dedicated library. Most notably, GeoNames has more (politically) neutral names. This should hopefully resolve all the issues people had around their country's name being improper.

As always, please consider supporting the project.

🎉 Cheers! 🎉

---

And as always, bugs are fixed, and many other improvements also come with this release.

<!-- Release notes generated using configuration in .github/release.yml at v3.3.0-rc.0 -->

## What's Changed

### 🚀 Features

- feat(mobile): stack edited photos over the original on upload by @santoshakil in <https://github.com/immich-app/immich/pull/31082>
- feat: birthday memories by @alextran1502 in <https://github.com/immich-app/immich/pull/30831>
- feat: people management by @danieldietzler in <https://github.com/immich-app/immich/pull/31620>
- feat(ml): trt-rtx by @mertalev in <https://github.com/immich-app/immich/pull/31863>

### 🌟 Enhancements

- feat(web): improve non-Latin text rendering on the map by @meesfrensel in <https://github.com/immich-app/immich/pull/31611>
- feat: improved storage template onboarding by @bwees in <https://github.com/immich-app/immich/pull/31531>
- feat(web): default the activity log to show the latest by @nekorevend in <https://github.com/immich-app/immich/pull/28938>
- feat(server): linear-light resampling by @mertalev in <https://github.com/immich-app/immich/pull/31236>
- feat(web): add leave album action by @kojomba in <https://github.com/immich-app/immich/pull/31768>
- feat(ml): improve model loading by @mertalev in <https://github.com/immich-app/immich/pull/31742>
- feat(ml): optimized model inference by @mertalev in <https://github.com/immich-app/immich/pull/31750>
- feat: editors can update album title & description by @jrasm91 in <https://github.com/immich-app/immich/pull/31805>
- feat(server): add support for .jfif files by @Trithereon in <https://github.com/immich-app/immich/pull/31778>
- feat: memory UI for birthday by @alextran1502 in <https://github.com/immich-app/immich/pull/31798>
- fix(server): use GeoNames for reverse-geocoded country names by @rufusutt in <https://github.com/immich-app/immich/pull/30199>
- feat: extract manufacturer and device for samsung videos by @jonastahl in <https://github.com/immich-app/immich/pull/29375>
- feat(server): sync OAuth claims on login (#8073) by @thomasdelorge in <https://github.com/immich-app/immich/pull/29013>

### 🐛 Bug fixes

- fix(ml): read CLIP model configs as UTF-8 by @justadityaraj in <https://github.com/immich-app/immich/pull/31075>
- fix(web): face editor coordinates on a not-yet-loaded video by @bo0tzz in <https://github.com/immich-app/immich/pull/31083>
- fix(mobile): handle transient loading states for map timelines by @agg23 in <https://github.com/immich-app/immich/pull/29735>
- fix(mobile): keep the original filename when sharing downloaded assets by @santoshakil in <https://github.com/immich-app/immich/pull/30267>
- fix(mobile): refresh server info when the websocket connects by @santoshakil in <https://github.com/immich-app/immich/pull/31144>
- fix: do not move faces of users other than the current owner by @danieldietzler in <https://github.com/immich-app/immich/pull/31145>
- fix(server): allow an empty assetIds array when creating an album shared link by @ufukdev in <https://github.com/immich-app/immich/pull/31098>
- fix: Build SDK in dev container by @Pecacheu in <https://github.com/immich-app/immich/pull/31096>
- fix(web): interaction with some filter elements closes the search panel by @alextran1502 in <https://github.com/immich-app/immich/pull/31107>
- fix(server): never unlink an untracked-file path that an asset now references by @justadityaraj in <https://github.com/immich-app/immich/pull/31074>
- fix: incorrect edit's openapi type by @alextran1502 in <https://github.com/immich-app/immich/pull/31218>
- fix(ml): race when submitting to rknn execution queue by @swbchangle in <https://github.com/immich-app/immich/pull/31143>
- fix(web): album date range formatting by @meesfrensel in <https://github.com/immich-app/immich/pull/28564>
- fix: face detection of edited assets by @danieldietzler in <https://github.com/immich-app/immich/pull/31240>
- fix(mobile): prevent inner mutability on Freezed classes by @agg23 in <https://github.com/immich-app/immich/pull/31229>
- fix(web): partner sharing timeline by @yranandika05 in <https://github.com/immich-app/immich/pull/31241>
- fix(mobile): use timeline scroll velocity to add placeholders by @agg23 in <https://github.com/immich-app/immich/pull/29443>
- fix(ml): openvino config has unnecessary devices and volumes by @mertalev in <https://github.com/immich-app/immich/pull/31253>
- fix(mobile): refresh the memory lane after resume by @santoshakil in <https://github.com/immich-app/immich/pull/31239>
- fix(mobile): make shared link download toggle depend on metadata toggle by @arth3mis in <https://github.com/immich-app/immich/pull/31264>
- fix(mobile): rewrite slideshow controller system by @agg23 in <https://github.com/immich-app/immich/pull/30771>
- fix(server): live photo transcode visibility by @jake-bybee in <https://github.com/immich-app/immich/pull/31319>
- fix(web): word-wrap long album names by @meesfrensel in <https://github.com/immich-app/immich/pull/31265>
- fix(web): use RTL-friendly layout for people panel buttons by @meesfrensel in <https://github.com/immich-app/immich/pull/31266>
- fix(mobile): hide negative age by @YarosMallorca in <https://github.com/immich-app/immich/pull/31341>
- fix: memory page navigation by @danieldietzler in <https://github.com/immich-app/immich/pull/31334>
- fix(web): change "View asset owners" to "Hide asset owners" when enabled by @jithendrabathala in <https://github.com/immich-app/immich/pull/31393>
- fix(server): vacuum after migrations, concurrent reindex by @mertalev in <https://github.com/immich-app/immich/pull/31424>
- fix: show partner assets on people page by @danieldietzler in <https://github.com/immich-app/immich/pull/31435>
- fix(web): asset remains in timeline after archive by @YarosMallorca in <https://github.com/immich-app/immich/pull/31348>
- fix(web): preserve search type by @YarosMallorca in <https://github.com/immich-app/immich/pull/31394>
- fix: sync client disconnect by @jrasm91 in <https://github.com/immich-app/immich/pull/31461>
- fix(web): scroll timeline to top when navigating without a scroll target by @timonrieger in <https://github.com/immich-app/immich/pull/31464>
- fix(web): show full path on hover in duplicates utility by @timonrieger in <https://github.com/immich-app/immich/pull/31468>
- fix: honor memory filters on explore page by @danieldietzler in <https://github.com/immich-app/immich/pull/31540>
- fix: face label clipping (again) by @danieldietzler in <https://github.com/immich-app/immich/pull/31402>
- fix: feature face update ignores soft-deleted faces by @danieldietzler in <https://github.com/immich-app/immich/pull/31533>
- fix: put back search untagged button by @alextran1502 in <https://github.com/immich-app/immich/pull/31476>
- fix: reset shouldChangePassword on password change by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/31276>
- fix: metadata extraction of faces by @danieldietzler in <https://github.com/immich-app/immich/pull/31551>
- feat: people merge improvements by @danieldietzler in <https://github.com/immich-app/immich/pull/31456>
- fix: make local album provider reactive by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/31582>
- fix: skip faces of other users when reassigning faces by @danieldietzler in <https://github.com/immich-app/immich/pull/31580>
- fix(web): trim strings before searching/comparing by @meesfrensel in <https://github.com/immich-app/immich/pull/31614>
- fix(mobile): load more than one image on Android with Remove animations by @agg23 in <https://github.com/immich-app/immich/pull/31587>
- fix(mobile): make EXIF provider reactive by @agg23 in <https://github.com/immich-app/immich/pull/31552>
- fix: set limit maximum zoom in asset viewer by @TokenLimitExceeded in <https://github.com/immich-app/immich/pull/31609>
- feat: asset face v3 by @jrasm91 in <https://github.com/immich-app/immich/pull/31591>
- fix(mobile): fill video placeholder to prevent flicker on open by @LeLunZ in <https://github.com/immich-app/immich/pull/31621>
- fix(mobile): show the real date for android local photos with no exif by @santoshakil in <https://github.com/immich-app/immich/pull/29193>
- fix(mobile): prevent live photo from getting stuck during dismiss animation by @LeLunZ in <https://github.com/immich-app/immich/pull/28080>
- fix(mobile): sync status page goes blank when the counts query fails by @santoshakil in <https://github.com/immich-app/immich/pull/31642>
- perf: faster server cold start by @holoskii in <https://github.com/immich-app/immich/pull/31630>
- fix(web): correct memory title date by @Dhruthiya in <https://github.com/immich-app/immich/pull/31643>
- fix(mobile): clamp out of range datetimes so timeline queries cannot crash by @santoshakil in <https://github.com/immich-app/immich/pull/30490>
- fix(web): scrollable search dropdown on mobile web by @meesfrensel in <https://github.com/immich-app/immich/pull/31634>
- fix(web): queue buttons focus outline by @meesfrensel in <https://github.com/immich-app/immich/pull/31657>
- fix(mobile): ios clear file cache feedback by @yranandika05 in <https://github.com/immich-app/immich/pull/31401>
- fix(mobile): prevent SurfaceLayer crashing on maps in Viewer on Android by @agg23 in <https://github.com/immich-app/immich/pull/31709>
- fix: preserve scroll position on memories page by @YarosMallorca in <https://github.com/immich-app/immich/pull/31588>
- fix(server): compare integrity paths independently of unicode normalization by @justadityaraj in <https://github.com/immich-app/immich/pull/31102>
- fix(mobile): retry the background backup when connectivity is restored by @santoshakil in <https://github.com/immich-app/immich/pull/30909>
- fix(web): refresh people after setting person thumbnail by @meesfrensel in <https://github.com/immich-app/immich/pull/31744>
- fix: save user\_version in migration transaction by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/31039>
- fix(mobile): play the server copy when the local video file cannot be read by @santoshakil in <https://github.com/immich-app/immich/pull/31606>
- fix(mobile): resume after the app was launched in the background by @santoshakil in <https://github.com/immich-app/immich/pull/31557>
- fix(web): prevent race when editing album description during upload by @dikshit-n in <https://github.com/immich-app/immich/pull/31758>
- fix(server): attach error handler to accepted sockets to prevent crash on connection reset by @aashish00021 in <https://github.com/immich-app/immich/pull/31079>
- fix(mobile): ask before deleting local only photos on android 10 and below by @santoshakil in <https://github.com/immich-app/immich/pull/31146>
- fix(web): remember selected search type by @DawidKrynski in <https://github.com/immich-app/immich/pull/31799>
- fix: face bounding box label alignment by @danieldietzler in <https://github.com/immich-app/immich/pull/31793>
- fix(server): incorrect scaling of rotated videos when transcoding by @fabxyz in <https://github.com/immich-app/immich/pull/31473>
- fix(web): keep other comments visible when deleting a comment by @DawidKrynski in <https://github.com/immich-app/immich/pull/31848>
- fix(server): write tag updates to exif table by @jorbrock in <https://github.com/immich-app/immich/pull/31425>
- fix(server): exclude hidden assets from large files search by @bo0tzz in <https://github.com/immich-app/immich/pull/31479>
- fix: favorite workflow step description by @xCJPECKOVERx in <https://github.com/immich-app/immich/pull/31840>
- fix(ml): stricter typing and request validation by @mertalev in <https://github.com/immich-app/immich/pull/31856>
- fix(server): emit sidecarwrites and assetupdates consequently by @meesfrensel in <https://github.com/immich-app/immich/pull/31777>
- fix: library watcher should respect ignore patterns by @etnoy in <https://github.com/immich-app/immich/pull/31418>
- fix: email template by @danieldietzler in <https://github.com/immich-app/immich/pull/31859>

### 📚 Documentation

- chore(docs): deprecate outlook SMTP by @mmomjian in <https://github.com/immich-app/immich/pull/31139>
- feat: new FAQ entries by @bo0tzz in <https://github.com/immich-app/immich/pull/31227>
- fix(docs): add needed mobile app developer setup step by @arth3mis in <https://github.com/immich-app/immich/pull/31263>
- docs(server): document the UTC timestamp format for timeBucket by @alangrainger in <https://github.com/immich-app/immich/pull/31421>
- chore(docs): add note about opening issues to contributing by @meesfrensel in <https://github.com/immich-app/immich/pull/31607>
- docs: link to the docker compose builder by @bo0tzz in <https://github.com/immich-app/immich/pull/31610>
- fix: page path in better face clusters guide by @bo0tzz in <https://github.com/immich-app/immich/pull/31671>
- docs: document locked folder session behaviour by @howroyd in <https://github.com/immich-app/immich/pull/31735>
- docs: update backup settings menu path to Database Dump Settings by @MalibThalion in <https://github.com/immich-app/immich/pull/31270>

### 🌐 Translations

- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/31376>

## New Contributors

- @ufukdev made their first contribution in <https://github.com/immich-app/immich/pull/31098>
- @Pecacheu made their first contribution in <https://github.com/immich-app/immich/pull/31096>
- @swbchangle made their first contribution in <https://github.com/immich-app/immich/pull/31143>
- @yranandika05 made their first contribution in <https://github.com/immich-app/immich/pull/31241>
- @arth3mis made their first contribution in <https://github.com/immich-app/immich/pull/31264>
- @maximal made their first contribution in <https://github.com/immich-app/immich/pull/31304>
- @jake-bybee made their first contribution in <https://github.com/immich-app/immich/pull/31319>
- @jithendrabathala made their first contribution in <https://github.com/immich-app/immich/pull/31393>
- @TokenLimitExceeded made their first contribution in <https://github.com/immich-app/immich/pull/31609>
- @holoskii made their first contribution in <https://github.com/immich-app/immich/pull/31630>
- @lg114 made their first contribution in <https://github.com/immich-app/immich/pull/31654>
- @Dhruthiya made their first contribution in <https://github.com/immich-app/immich/pull/31643>
- @howroyd made their first contribution in <https://github.com/immich-app/immich/pull/31735>
- @dikshit-n made their first contribution in <https://github.com/immich-app/immich/pull/31758>
- @aashish00021 made their first contribution in <https://github.com/immich-app/immich/pull/31079>
- @nekorevend made their first contribution in <https://github.com/immich-app/immich/pull/28938>
- @kojomba made their first contribution in <https://github.com/immich-app/immich/pull/31768>
- @DawidKrynski made their first contribution in <https://github.com/immich-app/immich/pull/31799>
- @Trithereon made their first contribution in <https://github.com/immich-app/immich/pull/31778>
- @fabxyz made their first contribution in <https://github.com/immich-app/immich/pull/31473>
- @rufusutt made their first contribution in <https://github.com/immich-app/immich/pull/30199>
- @avaly made their first contribution in <https://github.com/immich-app/immich/pull/31770>
- @MalibThalion made their first contribution in <https://github.com/immich-app/immich/pull/31270>
- @jonastahl made their first contribution in <https://github.com/immich-app/immich/pull/29375>
- @thomasdelorge made their first contribution in <https://github.com/immich-app/immich/pull/29013>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v3.2.4...v3.3.0-rc.0>
