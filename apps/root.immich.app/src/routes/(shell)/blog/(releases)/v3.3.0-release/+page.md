---
authors: [Immich Team]
description: Release notes for v3.3.0 – People sharing, birthday memories,
  auto-stacked mobile edits, and more!
id: 7f57b1e5-5003-48d9-9207-457ee4b5ff35
publishedAt: 2026-10-07
slug: v3.3.0-release
title: v3.3.0
type: release
---

Welcome to Immich `v3.3.0`!

This release includes people sharing, birthday memories, auto-stacked mobile edits, and a variety of other enhancements and bug fixes. Keep reading below for the full list of highlights.

## Highlights

- Shared people management
- Birthday memories
- Auto-stacked mobile edits
- Sync OAuth claims on every login
- Higher quality thumbnails and previews
- Machine learning performance and accuracy improvements (opt-in)
- New OCR models
- Notable fix: correct storage size on MacOS

### Shared people management

We are very pleased to release the next big milestone towards better sharing: people can now be shared!

As a user you can share people with another user in your cluster group:

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/8172fc1b8a85d4ade53e66244ff65a3d-428.avif" width="428" height="659" alt="Manage people access modal showing 86 people shared with Mich" />

:::info
Note: the “Manage access” modal can be opened from both the “People” (`/people`) and “Sharing settings” (`/user-settings`) pages in the web application. The modal is not available on mobile, yet.

:::

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/c833f7f0234e1ab76eaa6d48273fdbb0-622.avif" width="622" height="337" alt="Button to open the people access modal" />

When sharing a person with another user, the shared person:

- Shows up in both users’ list of people (on mobile and web)
- Shows up in the asset viewer / asset detail view on both owned and shared assets
- Can be edited by both users (only the name & birth date fields)

:::info
Note: Person sharing is directional. This means that each user needs to share each person back for edits to automatically work in both directions.

:::

By default, changes to the name & date of birth are reflected for both users. On the web, the “Edit person” modal has an option to change the name/date of birth for “Only me” instead of the whole group.

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/64ec0bc5ca7e19d3f77923b1049121a7-424.avif" width="424" height="431" alt="Edit person modal showing a checkbox &quot;Only change for me&quot;" />

Also, there is a preference for this behavior in the “Sharing settings”, which can be changed to make this the default behavior when editing a person. The setting can be changed here:[ https://my.immich.app/user-settings?isOpen=feature+peopl](https://my.immich.app/user-settings?isOpen=feature+people.)[e](https://my.immich.app/user-settings?isOpen=feature+people).

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/9c7f29e477f105774ea95b967b04a422-604.avif" width="604" height="113" alt="A dropdown that allows choosing whether changes should apply to everyone or just the current user" />

The setting has two options:

- “Everyone with shared access” — means an update will apply for everyone, covering the typical family use case where one or two users are supposed to be responsible for the entire family's people.
- “Only me” — means the names and dates of births will remain unchanged for other users

Lastly, by allowing cross-user merging, you can now merge a face from your own assets with people shared with you from other users. This is especially helpful if you didn't want to re-run facial recognition after joining a cluster group before. Now, after setting up bi-directional sharing, users can manually link people together.

### Birthday memories

In an effort of making Immich more joyful to use, we are introducing memories for people's birthdays.

If it's the birthday of a person in your library, Immich will now celebrate that with a special memory featuring previous birthdays.

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/4cfe7f815bea38c737ac988fde86807f-1200.webp" srcset="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/4cfe7f815bea38c737ac988fde86807f-720.webp 720w, https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/4cfe7f815bea38c737ac988fde86807f-1200.webp 1200w" width="1200" height="534" alt="The new birthday memory with confetti on hover" />

### Auto-stacked mobile edits

When using something other than Immich for editing images on your phone, Immich will now stack those edits on top of the original. This allows for Immich to show all edits in one place, without cluttering the timeline.

This should provide a more organized timeline, especially when you heavily rely on editing assets on your phone.

| <video autoplay src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/bbea7e456766b3123bc05cb2d6b0f7d8.mp4" controls>Your browser does not support the video tag.</video> | <Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/1de1fe1e10d62e03122940936fdf16b3-1488.avif" srcset="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/1de1fe1e10d62e03122940936fdf16b3-720.avif 720w, https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/1de1fe1e10d62e03122940936fdf16b3-1080.avif 1080w, https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/1de1fe1e10d62e03122940936fdf16b3-1488.avif 1488w" width="1488" height="2266" alt="Stacked asset showing a beach in gray tones" /> | <Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/31502d8ad63ba8e1ddc8715e4e1185b7-1488.avif" srcset="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/31502d8ad63ba8e1ddc8715e4e1185b7-720.avif 720w, https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/31502d8ad63ba8e1ddc8715e4e1185b7-1080.avif 1080w, https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/31502d8ad63ba8e1ddc8715e4e1185b7-1488.avif 1488w" width="1488" height="2266" alt="Stacked asset showing a colored beach" /> |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### Sync OAuth claims on every login

Immich supports OAuth claims for storage quota, the user role, and the preferred username. Up until now, those were only synced on registration.

Now, they can be synced on every login, allowing you to do active user management through your IDP, updating quotas and roles as you go and as necessary, and Immich will adopt those changes.

### Higher quality thumbnails and previews

Immich now uses a more accurate image resampling method, improving detail preservation and brightness, especially for high contrast details.

Before

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/3d1e5505a3ab676a497950e20c4cb10e-375.avif" width="375" height="250" alt="Picture of a dark sky showing little detail" />

After

<Markdown.Image src="https://static.immich.cloud/blog/7f57b1e5-5003-48d9-9207-457ee4b5ff35/3368965faedd7bd0c03ee044fe13df94-375.avif" width="375" height="250" alt="The same picture of a dark sky, showing much more detail" />

### Machine learning performance and accuracy improvements (opt-in)

:::info
Opt-in to the new machine learning models by adding the following environment variable to the machine learning container: `MACHINE_LEARNING_MODEL_REVISION=v2`

:::

After a long list of optimizations, ML is both significantly faster and uses less memory. This affects every backend, including CPU inference. However, the level of improvement varies by model and backend. Cases where certain backends (such as OpenVINO) produced wrong outputs at times should be resolved.

RKNPU, used by Rockchip boards, now supports every model in the catalog including OCR for the first time, bringing it to parity with other backends. Additionally, TensorRT RTX is now used for Ampere (30xx) and newer NVIDIA GPUs, improving performance significantly.

To fully benefit, set `MACHINE_LEARNING_MODEL_REVISION=v2`to allow more optimized models to be downloaded and used. Many of the improvements rely on these optimized models and will not take effect when using the old ones. The outputs of the new and old models are numerically equivalent, so switching doesn’t require re-running any tasks. This setting will be the default in a later release.

As always, keep in mind that the very first time you load a model requires more preparation work, so don’t be surprised if it takes some time at first. This preparation is cached and reused, so loading the model will be much faster after the first time.

### New OCR models

The PP-OCRv6 family is now supported. These models are significantly more accurate than the previous PP-OCRv5 generation while all being multilingual. PP-OCRv6\_tiny is efficient and suitable for modest hardware, PP-OCRv6\_small is a notable jump in accuracy compared to PP-OCRv5\_mobile, and PP-OCRv6\_medium improves on PP-OCRv5\_server as the highest quality and most demanding option.

### Notable fix: correct storage size on MacOS

The block size used to calculate the storage capacity and usage has some nuances to it. In some situations (_\*_&#x63;ough\*\*\* Docker on MacOS \*cough\*), we didn’t have enough information to correctly compute accurate values. With this release, the reported storage usage and capacity should now be correct.

#### Technical details

Recent NodeJS releases now expose the `frsize` property, which is sometimes different from `bsize` (“block size”). In those cases the calculate storage sizes could often be off by a factor of`4096` (or more). In fact, <https://github.com/immich-app/immich/issues/4318> has been our fourth oldest open issue (including the renovate dashboard), opened just over three years ago. Now, with accurate block sizes our storage calculation should be correct, even in Docker on MacOS.

We are very happy to finally see this issue resolved, even though it only meant a dependency bump and a tiny code change for us.

As always, please consider supporting the project.

🎉 Cheers! 🎉

---

And as always, bugs are fixed, and many other improvements also come with this release.

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
- feat(mobile): editors can update album title & description by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/31954>
- feat(web): add shortcut to remove assets from an album by @cratoo in <https://github.com/immich-app/immich/pull/31940>
- feat(ml): ppocr v6 by @mertalev in <https://github.com/immich-app/immich/pull/32147>

### 🐛 Bug fixes

- fix: Build SDK in dev container by @Pecacheu in <https://github.com/immich-app/immich/pull/31096>
- fix(ml): race when submitting to rknn execution queue by @swbchangle in <https://github.com/immich-app/immich/pull/31143>
- fix(mobile): use timeline scroll velocity to add placeholders by @agg23 in <https://github.com/immich-app/immich/pull/29443>
- fix(ml): openvino config has unnecessary devices and volumes by @mertalev in <https://github.com/immich-app/immich/pull/31253>
- fix(mobile): rewrite slideshow controller system by @agg23 in <https://github.com/immich-app/immich/pull/30771>
- fix: make local album provider reactive by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/31582>
- fix(web): trim strings before searching/comparing by @meesfrensel in <https://github.com/immich-app/immich/pull/31614>
- fix(mobile): load more than one image on Android with Remove animations by @agg23 in <https://github.com/immich-app/immich/pull/31587>
- fix(mobile): make EXIF provider reactive by @agg23 in <https://github.com/immich-app/immich/pull/31552>
- fix: set limit maximum zoom in asset viewer by @TokenLimitExceeded in <https://github.com/immich-app/immich/pull/31609>
- feat: asset face v3 by @jrasm91 in <https://github.com/immich-app/immich/pull/31591>
- fix(mobile): fill video placeholder to prevent flicker on open by @LeLunZ in <https://github.com/immich-app/immich/pull/31621>
- fix(mobile): show the real date for android local photos with no exif by @santoshakil in <https://github.com/immich-app/immich/pull/29193>
- fix(mobile): prevent live photo from getting stuck during dismiss animation by @LeLunZ in <https://github.com/immich-app/immich/pull/28080>
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
- fix(web): cull offscreen thumbnails on individual shared links by @bo0tzz in <https://github.com/immich-app/immich/pull/31890>
- fix: person management ids validation and permissions by @danieldietzler in <https://github.com/immich-app/immich/pull/31898>
- fix(server): person birthdate timezone bug by @jrasm91 in <https://github.com/immich-app/immich/pull/31901>
- fix(mobile): face thumbnail stuck blank after renaming a person by @santoshakil in <https://github.com/immich-app/immich/pull/30769>
- fix(server): make "limit" paramter use z.coerce by @aviv926 in <https://github.com/immich-app/immich/pull/31899>
- fix(server): dont queue unneeded jobs when no xmp file exists by @etnoy in <https://github.com/immich-app/immich/pull/31927>
- fix(server): ignore Samsung Gallery rotation tag for HEIF orientation by @bo0tzz in <https://github.com/immich-app/immich/pull/31937>
- fix: restore folder view scroll position by @raahu1l in <https://github.com/immich-app/immich/pull/31860>
- fix(ml): widen empty half-precision arrays by @mertalev in <https://github.com/immich-app/immich/pull/31950>
- fix(ml): serialize trt-rtx sessions by @mertalev in <https://github.com/immich-app/immich/pull/31951>
- fix(server): make library exclusion matching consistently case-insensitive by @etnoy in <https://github.com/immich-app/immich/pull/31970>
- fix: stale memory thumbnail by @danieldietzler in <https://github.com/immich-app/immich/pull/31975>
- fix: storage usage display on virtiofs and alike by @danieldietzler in <https://github.com/immich-app/immich/pull/31982>
- fix(server): include album owner for album shared links by @meesfrensel in <https://github.com/immich-app/immich/pull/31837>
- fix(mobile): don't re-upload a photo the server already has by @santoshakil in <https://github.com/immich-app/immich/pull/31941>
- fix(mobile): make the iOS background batch wait for its remote sync by @santoshakil in <https://github.com/immich-app/immich/pull/31942>
- fix(mobile): don't start the foreground backup in iOS background launches by @santoshakil in <https://github.com/immich-app/immich/pull/31943>
- fix(mobile): image jumps when full-res image loads during pinch or zoom animation by @LeLunZ in <https://github.com/immich-app/immich/pull/31948>
- fix(ml): upgrade to openvino 2026.4.1 by @mertalev in <https://github.com/immich-app/immich/pull/31996>
- fix(cli): sidecar precedence by @etnoy in <https://github.com/immich-app/immich/pull/31929>
- fix: metadata extraction for media streams with unknown profile by @danieldietzler in <https://github.com/immich-app/immich/pull/32007>
- fix: assetTagFilter any matching by @danieldietzler in <https://github.com/immich-app/immich/pull/32008>
- fix: improper filename sanitizing by @danieldietzler in <https://github.com/immich-app/immich/pull/32009>
- fix(server): don't select an audio stream ffprobe could not identify by @RxChi1d in <https://github.com/immich-app/immich/pull/30901>
- fix: stale memory cover by @danieldietzler in <https://github.com/immich-app/immich/pull/32098>
- fix(web): no trash actions when trash is empty by @meesfrensel in <https://github.com/immich-app/immich/pull/32097>
- fix: bounding box label clipping due to reactivity issue by @danieldietzler in <https://github.com/immich-app/immich/pull/32090>
- fix: people page search by @danieldietzler in <https://github.com/immich-app/immich/pull/32094>
- fix(web): album reactivity by @meesfrensel in <https://github.com/immich-app/immich/pull/32095>
- fix(ml): incorrect outputs on alchemist and battlemage by @mertalev in <https://github.com/immich-app/immich/pull/32110>
- fix: memory upcoming query by @jrasm91 in <https://github.com/immich-app/immich/pull/32164>
- fix(web): show face name label above box when it would be hidden by @joepadmiraal in <https://github.com/immich-app/immich/pull/32088>

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
- docs: add QNAP install guide by @hraabis in <https://github.com/immich-app/immich/pull/30695>

### 🌐 Translations

- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/31376>
- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/31864>

## New Contributors

- @Pecacheu made their first contribution in <https://github.com/immich-app/immich/pull/31096>
- @swbchangle made their first contribution in <https://github.com/immich-app/immich/pull/31143>
- @maximal made their first contribution in <https://github.com/immich-app/immich/pull/31304>
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
- @raahu1l made their first contribution in <https://github.com/immich-app/immich/pull/31860>
- @hraabis made their first contribution in <https://github.com/immich-app/immich/pull/30695>
- @ChocolateChipKookie made their first contribution in <https://github.com/immich-app/immich/pull/32123>
- @joepadmiraal made their first contribution in <https://github.com/immich-app/immich/pull/32088>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v3.2.4...v3.3.0>
