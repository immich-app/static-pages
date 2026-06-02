---
authors: [Immich Team]
description: Release notes for v2.6.0 — map side panel, share link slugs on mobile,
  native http clients, video player improvements on mobile and more!!
id: 37a7ae8a-eb60-4c24-b063-3362b47a0e09
publishedAt: 2026-03-19
slug: v2.6.0-release
title: Release v2.6.0
---

Welcome to Immich `v2.6.0`! This release is a collection of more than 350 commits over 6 weeks. I know, it is an eternity between releases compared to our previous era. This version focuses on bug fixes and enhancements across the app to provide a more delightful and smoother experience for you. This release also prepares for the next major release in the coming month, which will remove the old timeline implementation. Let's dive into the highlights of the release:

# Highlights

- Map side panel (web)
- Pick album cover (mobile)
- Shared link slugs (mobile)
- Shared link presets (web)
- Native HTTP clients (mobile)
- Video player and asset viewer improvements (mobile)
- Improved search results (mobile)
- `schema-check`: a new `immich-admin` command
- Read profile claims from id token (OAuth)
- Notable fix: cast videos now automatically loop
- Notable fix: correctly extract make and model from Sony XAVC video files
- Notable fix: escape key handling on web
- Notable fix: healthcheck endpoint in maintenance mode
- Notable fix: timeline rendering for RTL languages like Arabic and Herbrew
- Notable fix: prevent server crash when extracting invalid metadata

## Map side panel (web)

The map view on the web now opens a mini-timeline component as a side panel when you click on a cluster of assets. This makes it easier to view the cluster at a glance and enables bulk actions, such as favorite and add to album.

![](https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/a624f8ea59c33ad3d91c222f624ba586.webp)

## Pick album cover (mobile)

Users can now pick a new album cover directly from the mobile app.

<video autoplay src="https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/b9595215ac8e74a26ccc7b5f2d88a36b.mp4" controls>Your browser does not support the video tag.</video>

## Shared link slugs (mobile)

The mobile app now also supports setting a shared link slug, a feature that's been available on the web for a while.

<video autoplay src="https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/79a8a5aa07cac0490f692f45ccca9c72.mp4" controls>Your browser does not support the video tag.</video>

## Shared link presets (web)

The expiration form input on the web was always a bit confusing, but it's been updated to make it easier to see and understand when a shared link will expire.

![](https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/ab4f92803cebb7c7a6dbbd52bf15d607.webp)

## Native HTTP clients (mobile)

The mobile app now uses native HTTP clients across both Android and iOS, with support for mTLS, self-signed certificates, basic auth, and custom headers. These features should now be more reliable and extend to background tasks, video playback, and other parts of the app. This also improves the app's overall network request performance thanks to HTTP/2 and HTTP/3, multiplexing, and caching.

## Video player and asset viewer improvements (mobile)

The asset viewer has undergone many improvements under the hood to make it simpler, faster and more reliable. We've also added playback support for GIFs, enabled video zooming, and made many more bug fixes and tweaks.

### The asset viewer now uses a gradient for actions, and video controls have been restyled

![](https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/58647c0055da31ceccee4d3833f29463.webp)

### Inline asset details

This used to be a bottom sheet, and had a lot of glue for alignment. The new version is much more responsive and less buggy.

<video autoplay src="https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/12449de74e45523b7a947afb58510415.mp4" controls>Your browser does not support the video tag.</video>

## Improved search results (mobile)

The search results page now loads more results without rebuilding the entire grid, and should now load much faster. There are also new screens for when there are no search results and when all results have been loaded.

<video autoplay src="https://static.immich.cloud/blog/37a7ae8a-eb60-4c24-b063-3362b47a0e09/c4bb1bd1f6cb325ab55446a2210efd7f.mp4" controls>Your browser does not support the video tag.</video>

## `schema-check`: a new `immich-admin` command

A new `immich-admin` command has been added this release: `schema-check`. The command runs a report on the database to check if any indexes, constraints, tables or columns are missing. This check also runs automatically on start up.

## Read profile claims from `idToken` (OAuth)

Prior to `v2.6.0` Immich resolved the `email` and other claims from the [userinfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo) endpoint. Now, Immich also supports reading those claims directly from the `idToken`. This makes it possible to use providers such as Microsoft ADFS that do not support userinfo.

As always, please consider supporting the project.

🎉 Cheers! 🎉

---

\n<!-- Release notes generated using configuration in .github/release.yml at v2.6.0 -->

## What's Changed

### 🔒 Security

- fix(server): restrict individual shared link asset removal to owners by @michelheusschen in <https://github.com/immich-app/immich/pull/26868>
- fix: add to shared link by @jrasm91 in <https://github.com/immich-app/immich/pull/26886>

### 🚀 Features

- feat: shared link login by @jrasm91 in <https://github.com/immich-app/immich/pull/25678>
- feat: schema-check by @jrasm91 in <https://github.com/immich-app/immich/pull/25904>
- feat: add people deeplink by @arne182 in <https://github.com/immich-app/immich/pull/25686>
- feat(mobile): inline asset details by @uhthomas in <https://github.com/immich-app/immich/pull/25952>
- feat(mobile): filter by tags by @benjamonnguyen in <https://github.com/immich-app/immich/pull/26196>
- feat: add .mxf file support by @timonrieger in <https://github.com/immich-app/immich/pull/24644>
- feat: tap to see next/previous image by @thezeroalpha in <https://github.com/immich-app/immich/pull/20286>
- feat(mobile): Allow users to set album cover from mobile app by @timonrieger in <https://github.com/immich-app/immich/pull/25515>
- feat(mobile): Allow users to set profile picture from asset viewer by @timonrieger in <https://github.com/immich-app/immich/pull/25517>
- feat: ROCm 7.2 and MIGraphX support by @kprinssu in <https://github.com/immich-app/immich/pull/26178>
- feat(web): map timeline sidepanel by @michelheusschen in <https://github.com/immich-app/immich/pull/26532>
- feat: add responsive layout to broken asset by @midzelis in <https://github.com/immich-app/immich/pull/26384>
- feat(web): toggle zoom on double-click in photo viewer by @midzelis in <https://github.com/immich-app/immich/pull/26732>
- feat(mobile): show animated images in asset viewer by @LeLunZ in <https://github.com/immich-app/immich/pull/26614>
- feat(mobile): open in browser by @YarosMallorca in <https://github.com/immich-app/immich/pull/26369>

### 🌟 Enhancements

- feat: verify permissions by @jrasm91 in <https://github.com/immich-app/immich/pull/25647>
- feat(web): change link expiration logic & presets by @YarosMallorca in <https://github.com/immich-app/immich/pull/26064>
- feat(mobile): dynamic layout in new timeline by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/23837>
- feat(cli): change progress bar to display file size by @Nykri in <https://github.com/immich-app/immich/pull/23328>
- feat(mobile): dynamic multi-line album name by @uhthomas in <https://github.com/immich-app/immich/pull/26040>
- feat(mobile): hide search by context/OCR if disabled on server (#25472) by @Nacolis in <https://github.com/immich-app/immich/pull/26063>
- fix(release): add docker-compose.rootless.yml to released assets by @dnozay in <https://github.com/immich-app/immich/pull/26261>
- feat(web): show ocr text boxes in panoramas by @meesfrensel in <https://github.com/immich-app/immich/pull/25727>
- feat(web): loop chromecast video by @etnoy in <https://github.com/immich-app/immich/pull/24410>
- chore(web): merge "Add to album" and "Add to shared album" actions into a single action by @timonrieger in <https://github.com/immich-app/immich/pull/24669>
- feat(mobile): timeline - add bottomWidgetBuilder by @PeterOmbodi in <https://github.com/immich-app/immich/pull/25634>
- feat(mobile): video zooming in asset viewer by @goalie2002 in <https://github.com/immich-app/immich/pull/22036>
- feat(mobile): Add slug support for shared links by @Lauritz-Tieste in <https://github.com/immich-app/immich/pull/26441>
- feat: warn when losing transparency during thumbnail generation by @midzelis in <https://github.com/immich-app/immich/pull/26243>
- perf(mobile): optimized album sorting by @YarosMallorca in <https://github.com/immich-app/immich/pull/25179>
- feat(mobile): prompt when deleting from trash by @YarosMallorca in <https://github.com/immich-app/immich/pull/26392>
- feat: getAssetEdits respond with edit IDs by @bwees in <https://github.com/immich-app/immich/pull/26445>
- fix(server): accept showAt and hideAt for creating memories by @meesfrensel in <https://github.com/immich-app/immich/pull/26429>
- feat(server): SyncAssetEditV1 by @bwees in <https://github.com/immich-app/immich/pull/26446>
- feat: splash screen error page by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/26460>
- feat(mobile): add confirmation dialog to permanent delete action by @ByteSizedMarius in <https://github.com/immich-app/immich/pull/26442>
- feat: enhance face-editor positioning by @midzelis in <https://github.com/immich-app/immich/pull/26303>
- feat: improve HEIC, HEIF and JPEG XL browser support detection by @nicosemp in <https://github.com/immich-app/immich/pull/26122>
- refactor(web): remove replaceAsset action by @timonrieger in <https://github.com/immich-app/immich/pull/26444>
- feat(web): bounding box for faces when hovering over the face in photo view by @cratoo in <https://github.com/immich-app/immich/pull/26667>
- feat(mobile): keep search results visible by @uhthomas in <https://github.com/immich-app/immich/pull/26498>
- feat(mobile): use shared native client by @mertalev in <https://github.com/immich-app/immich/pull/25942>
- feat(mobile): SyncAssetEditV1 by @bwees in <https://github.com/immich-app/immich/pull/26518>
- feat(ml): enable openvino for cpu by @apejcic in <https://github.com/immich-app/immich/pull/22948>
- feat: responsive video duration in thumbnail by @midzelis in <https://github.com/immich-app/immich/pull/26770>
- feat(web): animate zoom toggle with cubicOut easing by @midzelis in <https://github.com/immich-app/immich/pull/26731>
- feat(mobile): consolidate video controls by @uhthomas in <https://github.com/immich-app/immich/pull/26673>
- feat(web): add shortcut "p" to open/close the face tag box by @cratoo in <https://github.com/immich-app/immich/pull/26826>
- feat(mobile): use material design 3 slider by @uhthomas in <https://github.com/immich-app/immich/pull/26829>
- feat: adaptive progressive image loading for photo viewer by @midzelis in <https://github.com/immich-app/immich/pull/26636>
- fix(server): extract make/model from sony video files by @brendanngo in <https://github.com/immich-app/immich/pull/26833>
- chore(mobile): remove background from asset viewer back button by @uhthomas in <https://github.com/immich-app/immich/pull/26851>
- feat(server): support IDPs that only send the userinfo in the ID token by @Belnadifia in <https://github.com/immich-app/immich/pull/26717>
- feat(web): improve OCR overlay text fitting, reactivity, and accessibility by @midzelis in <https://github.com/immich-app/immich/pull/26678>
- fix(web): allow pasting PIN code from clipboard or password manager by @pressslav in <https://github.com/immich-app/immich/pull/26944>

### 🐛 Bug fixes

- fix: ignore checksum constraint error when logging by @jrasm91 in <https://github.com/immich-app/immich/pull/26113>
- fix(web): use locale for date picker by @michelheusschen in <https://github.com/immich-app/immich/pull/26125>
- fix(web): escape shortcut handling by @michelheusschen in <https://github.com/immich-app/immich/pull/26096>
- fix(mobile): Login routing on Splash screen by @PeterOmbodi in <https://github.com/immich-app/immich/pull/26128>
- fix: null local date time in timeline queries by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/26133>
- fix(web): prevent event manager from throwing error by @michelheusschen in <https://github.com/immich-app/immich/pull/26156>
- fix(web): improve api key modal responsiveness by @klenner1 in <https://github.com/immich-app/immich/pull/26151>
- fix(web): show correct assets in memory gallery by @michelheusschen in <https://github.com/immich-app/immich/pull/26157>
- fix(web): add missing @immich/ui translations by @michelheusschen in <https://github.com/immich-app/immich/pull/26143>
- fix(mobile): timeline handling on foldable phones + ensuring that images are not cut off by @bkchr in <https://github.com/immich-app/immich/pull/25088>
- fix(mobile): prevent nav bar label text wrapping by @chrislongros in <https://github.com/immich-app/immich/pull/26011>
- fix(mobile): hide latest version warnings by @uhthomas in <https://github.com/immich-app/immich/pull/26036>
- fix(mobile): inconsistent query for people by @YarosMallorca in <https://github.com/immich-app/immich/pull/24437>
- fix(web): timeline multi select group state by @michelheusschen in <https://github.com/immich-app/immich/pull/26180>
- fix(web): add checkerboard background for transparent images by @agent-steven in <https://github.com/immich-app/immich/pull/26091>
- fix(mobile): inherit toolbar opacity by @uhthomas in <https://github.com/immich-app/immich/pull/25694>
- fix(web): focus tag input when modal opens by @michelheusschen in <https://github.com/immich-app/immich/pull/26256>
- fix(web): clear face boxes when switching assets by @michelheusschen in <https://github.com/immich-app/immich/pull/26249>
- fix(web): clear unsaved asset description when changing asset by @michelheusschen in <https://github.com/immich-app/immich/pull/26255>
- fix(web): clear cache when asset changes by @michelheusschen in <https://github.com/immich-app/immich/pull/26257>
- fix: utc time zone upserts by @danieldietzler in <https://github.com/immich-app/immich/pull/26258>
- fix: metadata crash by @jrasm91 in <https://github.com/immich-app/immich/pull/26327>
- fix: prevent server crash when extraction of metadata fails if the assets are corrupted by @Devansh-Jani in <https://github.com/immich-app/immich/pull/26042>
- fix(server): db restore failure when `DB_URL` is set to unix-domain socket connection by @fabio-garavini in <https://github.com/immich-app/immich/pull/26252>
- fix: Download the edited version when downloading multiple photos by @MontejoJorge in <https://github.com/immich-app/immich/pull/26259>
- fix: include `DROP INDEX` in transaction to prevent missing index on rollback by @haoxi911 in <https://github.com/immich-app/immich/pull/25399>
- fix: safari address bar color by @jrasm91 in <https://github.com/immich-app/immich/pull/26346>
- fix(web): prevent panorama image reload during asset updates by @michelheusschen in <https://github.com/immich-app/immich/pull/26349>
- fix(web): favoriting assets opened via GalleryViewer by @michelheusschen in <https://github.com/immich-app/immich/pull/26350>
- fix(i18n): add translation key for partner's photos by @timonrieger in <https://github.com/immich-app/immich/pull/26348>
- fix(web): single select scroll behavior by @timonrieger in <https://github.com/immich-app/immich/pull/26358>
- perf: add indexes to improve People API response times by @bxtdvd in <https://github.com/immich-app/immich/pull/26337>
- fix: pin code reset modal by @jrasm91 in <https://github.com/immich-app/immich/pull/26370>
- fix(mobile): Reset "People" search filter chip if no selections are made by @benjamonnguyen in <https://github.com/immich-app/immich/pull/26267>
- fix(cli): delete sidecar files after upload if requested by @timonrieger in <https://github.com/immich-app/immich/pull/26353>
- fix(web): album description auto height by @michelheusschen in <https://github.com/immich-app/immich/pull/26420>
- fix(web): prevent side panel overlap during transition by @michelheusschen in <https://github.com/immich-app/immich/pull/26398>
- fix(web): storage template example by @mmomjian in <https://github.com/immich-app/immich/pull/26424>
- fix(web): prevent `state_unsafe_mutation` error on people page by @michelheusschen in <https://github.com/immich-app/immich/pull/26438>
- fix: missing deletedAt and isVisible columns on mobile by @bwees in <https://github.com/immich-app/immich/pull/26414>
- fix(mobile): joinLocal on archived timeline by @YarosMallorca in <https://github.com/immich-app/immich/pull/26387>
- fix: always show library scan button by @etnoy in <https://github.com/immich-app/immich/pull/26428>
- fix: retain asset when either asset is a favorite by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/26473>
- fix(web): prevent null folder tree on concurrent load by @michelheusschen in <https://github.com/immich-app/immich/pull/26489>
- fix(web): toast warning when trying to upload unsupported file type by @meesfrensel in <https://github.com/immich-app/immich/pull/26492>
- fix(mobile): birthday picker shows limited months when no date exists by @socksprox in <https://github.com/immich-app/immich/pull/26407>
- fix: consider DAR when extracting video dimension by @alextran1502 in <https://github.com/immich-app/immich/pull/25293>
- feat(mobile): Prevent premature image cache eviction when higher image loading is enabled by @LeLunZ in <https://github.com/immich-app/immich/pull/26208>
- refactor: star rating by @meesfrensel in <https://github.com/immich-app/immich/pull/26357>
- fix(mobile): set correct initial system-ui mode in asset viewer by @goalie2002 in <https://github.com/immich-app/immich/pull/26500>
- fix(server): Live Photo migration bug when album is in template by @NikhilAlapati in <https://github.com/immich-app/immich/pull/25329>
- fix(web): handle delete shortcut on shared link page as remove by @meesfrensel in <https://github.com/immich-app/immich/pull/26552>
- fix(mobile): prevent video player from being recreated unnecessarily by @uhthomas in <https://github.com/immich-app/immich/pull/26553>
- fix(mobile): don't cut off top corners of app bar by @uhthomas in <https://github.com/immich-app/immich/pull/26550>
- feat: update onnxruntime-openvino to 1.24.1 and intel drivers by @savely-krasovsky in <https://github.com/immich-app/immich/pull/26565>
- fix: hide download action for local/merged assets by @YarosMallorca in <https://github.com/immich-app/immich/pull/26461>
- fix(web): top bar z index on search page by @YarosMallorca in <https://github.com/immich-app/immich/pull/26582>
- fix(web): show shared link download button when logged in by @Snowknight26 in <https://github.com/immich-app/immich/pull/26629>
- fix(mobile): asset viewer hero animation by @uhthomas in <https://github.com/immich-app/immich/pull/26545>
- fix(web): timeline and asset viewer RTL support by @meesfrensel in <https://github.com/immich-app/immich/pull/26513>
- fix(server): clean up edited thumbnail when deleting asset by @michelheusschen in <https://github.com/immich-app/immich/pull/26664>
- fix: implement existing withStacked on searchAssetBuilder by @babbitt in <https://github.com/immich-app/immich/pull/26607>
- fix(mobile): video state by @uhthomas in <https://github.com/immich-app/immich/pull/26574>
- fix(maintenance mode): wait for valid server config on restart by @insertish in <https://github.com/immich-app/immich/pull/26456>
- fix(web): inconsistent asset nav bar state after visiting shared link by @Snowknight26 in <https://github.com/immich-app/immich/pull/26674>
- fix(web): download toast showing wrong filename for motion assets by @Snowknight26 in <https://github.com/immich-app/immich/pull/26689>
- fix(mobile): add safe area for asset details by @uhthomas in <https://github.com/immich-app/immich/pull/26675>
- fix(web): combobox dropdown positioning in modals by @michelheusschen in <https://github.com/immich-app/immich/pull/26707>
- fix(web): video stealing focus when it plays again when looping by @Snowknight26 in <https://github.com/immich-app/immich/pull/26704>
- fix(ml): batch size setting by @mertalev in <https://github.com/immich-app/immich/pull/26524>
- fix(server): clarify transcoding bitrate policy by @meesfrensel in <https://github.com/immich-app/immich/pull/26711>
- fix: playback style migration by @alextran1502 in <https://github.com/immich-app/immich/pull/26718>
- fix(web): asset viewer showing wrong viewer type when hovering on stack thumbnails by @Snowknight26 in <https://github.com/immich-app/immich/pull/26741>
- fix(server): opus handling as accepted audio codec in transcode policy by @skatsubo in <https://github.com/immich-app/immich/pull/26736>
- fix(web): refresh recent albums sidebar after album changes by @michelheusschen in <https://github.com/immich-app/immich/pull/26757>
- fix(web): show the correct cursor at crop bounds when editing an asset by @Snowknight26 in <https://github.com/immich-app/immich/pull/26748>
- fix(web): recalculate face bounding boxes by @cratoo in <https://github.com/immich-app/immich/pull/26737>
- fix(web): context menu overflow by @SevereCloud in <https://github.com/immich-app/immich/pull/26760>
- fix(web): correct tag rounding in search options by @michelheusschen in <https://github.com/immich-app/immich/pull/26814>
- fix(web): prevent unrelated assets from appearing in tag view by @michelheusschen in <https://github.com/immich-app/immich/pull/26816>
- fix(mobile): use tabular figures in backup page by @uhthomas in <https://github.com/immich-app/immich/pull/26830>
- fix(mobile): wrap backup error message text by @uhthomas in <https://github.com/immich-app/immich/pull/26834>
- fix(server): use correct day ordering in timeline buckets by @michelheusschen in <https://github.com/immich-app/immich/pull/26821>
- fix(web): face selection box position resetting on browser resize by @Snowknight26 in <https://github.com/immich-app/immich/pull/26766>
- fix: use correct original URL for 360 video panorama playback by @luis15pt in <https://github.com/immich-app/immich/pull/26831>
- fix(web): disable drag and drop for internal items by @michelheusschen in <https://github.com/immich-app/immich/pull/26897>
- fix(web): keep header fixed on individual shared links by @michelheusschen in <https://github.com/immich-app/immich/pull/26892>
- fix: SMTP over TLS by @nathanielhourt in <https://github.com/immich-app/immich/pull/26893>
- fix(web): copy yearMonth in MonthGroup to avoid shared object reference with asset in <https://github.com/immich-app/immich/pull/26890>
- fix(mobile): use shared auth for background_downloader by @mertalev in <https://github.com/immich-app/immich/pull/26911>
- fix(web): prevent search page error on missing album filter by @michelheusschen in <https://github.com/immich-app/immich/pull/26948>
- fix(server): sync files to disk by @uhthomas in <https://github.com/immich-app/immich/pull/26881>
- fix(web): jump to primary stacked asset from memory by @michelheusschen in <https://github.com/immich-app/immich/pull/26978>
- fix(mobile): reflect asset deletions instantly by @uhthomas in <https://github.com/immich-app/immich/pull/26835>
- fix: healthcheck by @jrasm91 in <https://github.com/immich-app/immich/pull/26989>
- fix(web): escape handling for tagging and adding a face in asset viewer by @cratoo in <https://github.com/immich-app/immich/pull/26870>
- fix: filter after searching by asset id by @jrasm91 in <https://github.com/immich-app/immich/pull/26994>
- fix: bounding box return type by @jrasm91 in <https://github.com/immich-app/immich/pull/27014>
- fix: validate accept header before returning html by @jrasm91 in <https://github.com/immich-app/immich/pull/27019>

### 📚 Documentation

- chore(docs): Update help channel for developers by @Mraedis in <https://github.com/immich-app/immich/pull/26284>
- feat(docs): Explain configuration file location for Docker Compose by @keunes in <https://github.com/immich-app/immich/pull/24989>
- chore(docs): add quick-start guide for DevPod with docker by @dhlavaty in <https://github.com/immich-app/immich/pull/26213>
- feat(docs): Adding information about parameter c= by @aviv926 in <https://github.com/immich-app/immich/pull/26430>
- feat: doc links by @jrasm91 in <https://github.com/immich-app/immich/pull/26519>
- fix(docs): add ocr to job flow diagram by @niij in <https://github.com/immich-app/immich/pull/26505>

### 🌐 Translations

- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/26118>
- fix: clarify external domain setting is used for emails too by @chrislongros in <https://github.com/immich-app/immich/pull/26009>
- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/26167>
- fix(web): error page i18n by @meesfrensel in <https://github.com/immich-app/immich/pull/26517>
- chore(web): clarify locale settings description by @meesfrensel in <https://github.com/immich-app/immich/pull/25562>
- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/26192>

## New Contributors

- @klenner1 made their first contribution in <https://github.com/immich-app/immich/pull/26151>
- @bkchr made their first contribution in <https://github.com/immich-app/immich/pull/25088>
- @chrislongros made their first contribution in <https://github.com/immich-app/immich/pull/26011>
- @agent-steven made their first contribution in <https://github.com/immich-app/immich/pull/26091>
- @dhlavaty made their first contribution in <https://github.com/immich-app/immich/pull/26238>
- @Nacolis made their first contribution in <https://github.com/immich-app/immich/pull/26063>
- @ewinnd made their first contribution in <https://github.com/immich-app/immich/pull/26277>
- @dnozay made their first contribution in <https://github.com/immich-app/immich/pull/26261>
- @keunes made their first contribution in <https://github.com/immich-app/immich/pull/24989>
- @Devansh-Jani made their first contribution in <https://github.com/immich-app/immich/pull/26042>
- @benjamonnguyen made their first contribution in <https://github.com/immich-app/immich/pull/26196>
- @fabio-garavini made their first contribution in <https://github.com/immich-app/immich/pull/26252>
- @haoxi911 made their first contribution in <https://github.com/immich-app/immich/pull/25399>
- @thezeroalpha made their first contribution in <https://github.com/immich-app/immich/pull/20286>
- @socksprox made their first contribution in <https://github.com/immich-app/immich/pull/26407>
- @kprinssu made their first contribution in <https://github.com/immich-app/immich/pull/26178>
- @babbitt made their first contribution in <https://github.com/immich-app/immich/pull/26607>
- @niij made their first contribution in <https://github.com/immich-app/immich/pull/26505>
- @cratoo made their first contribution in <https://github.com/immich-app/immich/pull/26667>
- @M123-dev made their first contribution in <https://github.com/immich-app/immich/pull/26630>
- @apejcic made their first contribution in <https://github.com/immich-app/immich/pull/22948>
- @SevereCloud made their first contribution in <https://github.com/immich-app/immich/pull/26760>
- @brendanngo made their first contribution in <https://github.com/immich-app/immich/pull/26833>
- @luis15pt made their first contribution in <https://github.com/immich-app/immich/pull/26831>
- @nathanielhourt made their first contribution in <https://github.com/immich-app/immich/pull/26893>
- @Belnadifia made their first contribution in <https://github.com/immich-app/immich/pull/26717>
- @pressslav made their first contribution in <https://github.com/immich-app/immich/pull/26944>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.5.6...v2.6.0>
