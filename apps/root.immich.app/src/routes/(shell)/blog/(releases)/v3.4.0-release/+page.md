---
authors: [Immich Team]
description: Release notes for v3.4.0 – TODO
id: 585e319b-5cdc-459a-b1e3-8ff293ac4566
publishedAt: 2026-10-29
slug: v3.4.0-release
title: v3.4.0
type: release
---

Welcome to Immich `v3.4.0`!

This release adds passkey login (web), workflow improvements, JPEG XL support, tags on mobile (finally?!), a plethora of security fixes and other improvements and bug fixes.

## Highlights

- Passkeys (web)
- Make/model display changes
- Workflow improvements
- Security fixes
- Performance improvements

### Passkeys (web)

Immich web now has passkeys support. Create a passkey under User Settings => Passkeys and use it to login. Similar to password login and OAuth login, passkeys can be turned on or off in admin settings.

Passkey login for mobile is a bit more complicated, especially because of the self-hosted aspect (passkeys are tied to domains), but they should be available soon.

<Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/6d81f88aa4b4f3a381d04122f7278405-1207.avif" srcset="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/6d81f88aa4b4f3a381d04122f7278405-720.avif 720w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/6d81f88aa4b4f3a381d04122f7278405-1080.avif 1080w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/6d81f88aa4b4f3a381d04122f7278405-1207.avif 1207w" width="1207" height="492" alt="User passkey settings with a Bitwarden passkey entry." /> <Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/ddb4baee54c313728504d4da67895775-1809.avif" srcset="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/ddb4baee54c313728504d4da67895775-720.avif 720w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/ddb4baee54c313728504d4da67895775-1080.avif 1080w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/ddb4baee54c313728504d4da67895775-1440.avif 1440w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/ddb4baee54c313728504d4da67895775-1809.avif 1809w" width="1809" height="997" alt="Immich login page with a new &quot;Login with passkey&quot; button." />

### Make/model display changes

Manufacturer names are sometimes duplicated in the camera make, but many of these have now been fixed.

<Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/54e0952588d621870f03990d4a7cc95a-1120.avif" srcset="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/54e0952588d621870f03990d4a7cc95a-720.avif 720w, https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/54e0952588d621870f03990d4a7cc95a-1120.avif 1120w" width="1120" height="186" alt="Camera make &amp; model values before and after the change." />

### Workflows improvements

There are two new match types for the EXIF metadata filter, `missing` and `present`. Use these properties instead of a pattern when you only need to know if the property is present or not.

<Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/d03de4e64b21047c469b8b118eab3683-655.avif" width="655" height="810" alt="Workflows &quot;Add step&quot; modal showing the EXIF metadata filter with the match type dropdown open" />

Further, there is a new trigger to run a workflow once OCR processing has finished.

<Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/f47f2fee0c8db8c80092717b7d7b75cd-619.avif" width="619" height="432" alt="Workflows select trigger modal showing the new &quot;Asset OCR Extraction&quot; trigger" />This is particularly useful in combination with the new OCR text filter.

<Markdown.Image src="https://static.immich.cloud/blog/585e319b-5cdc-459a-b1e3-8ff293ac4566/a14d955e2337a91d9325ea080c7b13e4-620.avif" width="620" height="788" alt="Workflows &quot;Add step&quot; modal showing the OCR text filter" />In combination, you can for instance build a workflow that automatically adds receipts to an album, based on typical keywords one would find on a receipt.

### Security fixes

Thanks to @bo0tzz for a whole batch of security fixes and improvements, including a CSP change which now no longer ships with `unsafe-inline`.

As always, please consider supporting the project.

🎉 Cheers! 🎉

---

And as always, bugs are fixed, and many other improvements also come with this release.

## What's Changed

### 🔒 Security

- fix(server): apply shared link metadata visibility in asset mapper by @bo0tzz in <https://github.com/immich-app/immich/pull/32561>
- fix(server): anchor plugin allowedHosts matching by @bo0tzz in <https://github.com/immich-app/immich/pull/32560>
- fix(server): require upload access for checksum duplicate check by @bo0tzz in <https://github.com/immich-app/immich/pull/32559>
- fix(server): escape template variables in custom email templates by @bo0tzz in <https://github.com/immich-app/immich/pull/32563>
- fix(cli): only act on files that were sent in the bulk upload check by @bo0tzz in <https://github.com/immich-app/immich/pull/32564>
- fix(server): restrict partner timeline requests to timeline assets by @bo0tzz in <https://github.com/immich-app/immich/pull/32565>
- fix(server): sanitize EXIF template variables and tighten storage path check by @bo0tzz in <https://github.com/immich-app/immich/pull/32566>
- fix(server): only serve edited assets to shared links in archive downloads by @bo0tzz in <https://github.com/immich-app/immich/pull/32562>
- fix(server): only set OAuth cookies for server-generated state by @bo0tzz in <https://github.com/immich-app/immich/pull/32600>
- fix(server): do not expose album members to shared link viewers by @bo0tzz in <https://github.com/immich-app/immich/pull/32607>
- fix(server): dont follow symlinks by @etnoy in <https://github.com/immich-app/immich/pull/32614>
- fix(server): exclude partners' locked assets from legacy search by @bo0tzz in <https://github.com/immich-app/immich/pull/32604>
- feat(server): remove deprecated password field from update-me by @bo0tzz in <https://github.com/immich-app/immich/pull/32623>
- fix(server): require update access on the motion video when linking a live photo by @bo0tzz in <https://github.com/immich-app/immich/pull/32606>
- feat: inline hashes in helmet CSP by @bo0tzz in <https://github.com/immich-app/immich/pull/30529>
- fix(server): scope duplicate group resolution to the caller's assets by @bo0tzz in <https://github.com/immich-app/immich/pull/32603>

### 🚀 Features

- feat: option for mobile smooth timeline scrubbing by @TiDeane in <https://github.com/immich-app/immich/pull/32552>
- feat: passkeys by @jrasm91 in <https://github.com/immich-app/immich/pull/32194>
- feat(mobile): jxl decoder by @mertalev in <https://github.com/immich-app/immich/pull/32592>
- feat(server): add jxl as target format by @mertalev in <https://github.com/immich-app/immich/pull/32732>
- feat: backups by @insertish in <https://github.com/immich-app/immich/pull/32268>

### 🌟 Enhancements

- feat(mobile): mobile tags by @staticdog in <https://github.com/immich-app/immich/pull/30753>
- feat(mobile): limit max zoom by image pixel size by @LeLunZ in <https://github.com/immich-app/immich/pull/32423>
- feat(mobile): share logs from the startup error screen by @santoshakil in <https://github.com/immich-app/immich/pull/32288>
- perf(web): reduce favicon assets by @cevdetch in <https://github.com/immich-app/immich/pull/32594>
- perf: RKNN half RAM model usage + no weight duplication in multi-core by @todorangrg in <https://github.com/immich-app/immich/pull/23958>
- feat: workflow filter by missing EXIF property by @austinmdillow in <https://github.com/immich-app/immich/pull/32713>
- feat(server): add OCR extraction workflow filter by @avaly in <https://github.com/immich-app/immich/pull/32464>
- fix: avoid duplicate manufacturer in camera name by @brent20 in <https://github.com/immich-app/immich/pull/32657>
- feat(web): enable the shortcut "f" to favorite/unfavorite in multiselection mode by @Bautrell12 in <https://github.com/immich-app/immich/pull/31411>
- feat(server): compress database backups with pigz when it is installed by @zackpollard in <https://github.com/immich-app/immich/pull/32806>

### 🐛 Bug fixes

- fix(mobile): stop playing video when dismissing on iOS by @agg23 in <https://github.com/immich-app/immich/pull/31772>
- fix(mobile): sort timeline assets by the date their headers group on by @santoshakil in <https://github.com/immich-app/immich/pull/30262>
- fix(mobile): cancel the iOS background uploads when the foreground backup starts by @santoshakil in <https://github.com/immich-app/immich/pull/31944>
- fix(server): offline live photo motion deletion by @zackpollard in <https://github.com/immich-app/immich/pull/32077>
- fix(mobile): decouple delete action messages from context by @PeterOmbodi in <https://github.com/immich-app/immich/pull/31093>
- fix(mobile): start the session when a link opens the app by @santoshakil in <https://github.com/immich-app/immich/pull/32181>
- fix(mobile): prevent timeline bucket selection provider leak by @PeterOmbodi in <https://github.com/immich-app/immich/pull/32100>
- fix(mobile): format year filter chip without thousands separator by @devyourown in <https://github.com/immich-app/immich/pull/32159>
- fix(ml): move logging config to code by @bo0tzz in <https://github.com/immich-app/immich/pull/32220>
- fix(mobile): stop long images squishing on android by @santoshakil in <https://github.com/immich-app/immich/pull/32213>
- fix(logging): avoid multiline logging of feature flags in server service by @brandon1024 in <https://github.com/immich-app/immich/pull/32275>
- fix(ml): Round OCR max resolution up to a multiple of 32 by @murarustefaan in <https://github.com/immich-app/immich/pull/32263>
- fix(web): don't swallow Escape in sidebar by @ChocolateChipKookie in <https://github.com/immich-app/immich/pull/32364>
- fix(web): event manager forgetting subscribed callbacks by @meesfrensel in <https://github.com/immich-app/immich/pull/32217>
- fix(web): update album start date when the album changes by @DawidKrynski in <https://github.com/immich-app/immich/pull/32242>
- perf(server): check shared link asset access without scanning the album by @bo0tzz in <https://github.com/immich-app/immich/pull/32411>
- perf(server): stop loading every album asset to build album responses by @bo0tzz in <https://github.com/immich-app/immich/pull/32413>
- perf(server): stop aggregating every album asset when loading a shared link by @bo0tzz in <https://github.com/immich-app/immich/pull/32412>
- fix(mobile): show play instead of replay button for unplayed videos by @LeLunZ in <https://github.com/immich-app/immich/pull/32307>
- fix(mobile): render random widget images at the widget's display resolution by @devyourown in <https://github.com/immich-app/immich/pull/32215>
- fix(mobile): save typed coordinates in the location picker by @santoshakil in <https://github.com/immich-app/immich/pull/32460>
- fix(mobile): sort time zones by name within the same offset by @devyourown in <https://github.com/immich-app/immich/pull/32087>
- fix(mobile): Keep asset viewer controls hidden if they were hidden before zooming. by @dagstuan in <https://github.com/immich-app/immich/pull/31832>
- fix: user admin actions by @jrasm91 in <https://github.com/immich-app/immich/pull/32491>
- fix: smtp email visibility by @jrasm91 in <https://github.com/immich-app/immich/pull/32492>
- fix(web): update FaceEditor to handle HLS video elements correctly by @T-Zaid in <https://github.com/immich-app/immich/pull/32538>
- fix: unsupported locale for date format by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/32267>
- fix(mobile): fallback localizations for unsupported locales by @santoshakil in <https://github.com/immich-app/immich/pull/32452>
- fix(mobile): hide server addresses and tokens in shared logs by @santoshakil in <https://github.com/immich-app/immich/pull/32287>
- fix: locking around concurrency-1 jobs by @bo0tzz in <https://github.com/immich-app/immich/pull/28410>
- fix(mobile): hide server addresses in upload error logs by @santoshakil in <https://github.com/immich-app/immich/pull/32550>
- perf(server): index updateId on asset\_face, stack and workflow by @bo0tzz in <https://github.com/immich-app/immich/pull/32432>
- fix(ml): preloaded model loaded twice by @YarosMallorca in <https://github.com/immich-app/immich/pull/32610>
- fix(mobile): keep header image when starting selection by @clementdelestre in <https://github.com/immich-app/immich/pull/32356>
- fix(mobile): bump sqlite3\_connection\_pool to 0.2.13 by @santoshakil in <https://github.com/immich-app/immich/pull/32662>
- fix(mobile): stop trashing assets after deletion cancellation by @DustinOnGithub in <https://github.com/immich-app/immich/pull/32522>
- fix(mobile): cancel cronet image requests only between reads by @santoshakil in <https://github.com/immich-app/immich/pull/32659>
- perf(server): use a createdAt range for "recently added" time buckets by @bo0tzz in <https://github.com/immich-app/immich/pull/32434>
- fix: watch asset delete/archive in search by @YarosMallorca in <https://github.com/immich-app/immich/pull/31343>
- fix(server): index edited assets in smart search by @MaxRink in <https://github.com/immich-app/immich/pull/32300>
- fix(web): show metadata field if it is missing for one duplicate asset by @meesfrensel in <https://github.com/immich-app/immich/pull/32601>
- fix(web): downloads aborted when switching assets in the viewer by @antoniosarro in <https://github.com/immich-app/immich/pull/32663>
- fix: preserve stack primary asset selection by @KairuiLiu in <https://github.com/immich-app/immich/pull/31380>
- fix: permission for admin notification endpoints by @YarosMallorca in <https://github.com/immich-app/immich/pull/32567>
- fix(server): add album-shared assets to albums by @YarosMallorca in <https://github.com/immich-app/immich/pull/32609>
- perf(server): index asset (ownerId, updateId) for sync by @bo0tzz in <https://github.com/immich-app/immich/pull/32624>
- fix(server): anchor the folder view path match by @bo0tzz in <https://github.com/immich-app/immich/pull/32612>
- feat: cluster group admin permission for regenerate people by @danieldietzler in <https://github.com/immich-app/immich/pull/32787>
- fix: include partner shared assets for people even without showInTimeline by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/32675>
- perf(server): only serialize exif for returned search rows by @bo0tzz in <https://github.com/immich-app/immich/pull/32620>
- fix(mobile): ocr delete by asset by @F-Ethan in <https://github.com/immich-app/immich/pull/32611>
- fix(mobile): use context search once server features are loaded by @DawidKrynski in <https://github.com/immich-app/immich/pull/31800>
- fix(server): normalize bounding boxes when matching detected faces to existing faces by @pauverblom in <https://github.com/immich-app/immich/pull/32486>

### 📚 Documentation

- fix: clarify PUT to PATCH migration by @danieldietzler in <https://github.com/immich-app/immich/pull/32010>
- docs: add Polish README translation by @jakksoft in <https://github.com/immich-app/immich/pull/32745>
- fix(docs): update README\_ca\_ES.md to match the English version by @Ereza in <https://github.com/immich-app/immich/pull/30300>

### 🌐 Translations

- fix(i18n): remove unused load preview translations by @LeLunZ in <https://github.com/immich-app/immich/pull/32343>
- fix(mobile): update share quality option text from "Thumbnail" to "Preview" by @LeLunZ in <https://github.com/immich-app/immich/pull/32340>
- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/32256>

## New Contributors

- @devyourown made their first contribution in <https://github.com/immich-app/immich/pull/32159>
- @brandon1024 made their first contribution in <https://github.com/immich-app/immich/pull/32275>
- @murarustefaan made their first contribution in <https://github.com/immich-app/immich/pull/32263>
- @staticdog made their first contribution in <https://github.com/immich-app/immich/pull/30753>
- @T-Zaid made their first contribution in <https://github.com/immich-app/immich/pull/32538>
- @MateusNavarro77 made their first contribution in <https://github.com/immich-app/immich/pull/32503>
- @TiDeane made their first contribution in <https://github.com/immich-app/immich/pull/32552>
- @DustinOnGithub made their first contribution in <https://github.com/immich-app/immich/pull/32522>
- @jakksoft made their first contribution in <https://github.com/immich-app/immich/pull/32745>
- @MaxRink made their first contribution in <https://github.com/immich-app/immich/pull/32300>
- @KairuiLiu made their first contribution in <https://github.com/immich-app/immich/pull/31380>
- @Ereza made their first contribution in <https://github.com/immich-app/immich/pull/30300>
- @todorangrg made their first contribution in <https://github.com/immich-app/immich/pull/23958>
- @austinmdillow made their first contribution in <https://github.com/immich-app/immich/pull/32713>
- @yuee3 made their first contribution in <https://github.com/immich-app/immich/pull/32549>
- @brent20 made their first contribution in <https://github.com/immich-app/immich/pull/32657>
- @F-Ethan made their first contribution in <https://github.com/immich-app/immich/pull/32611>
- @Bautrell12 made their first contribution in <https://github.com/immich-app/immich/pull/31411>
- @pauverblom made their first contribution in <https://github.com/immich-app/immich/pull/32486>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v3.3.5...v3.4.0-rc.0>
