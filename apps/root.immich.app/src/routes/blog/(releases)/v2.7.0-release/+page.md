---
authors: [Immich Team]
description: Release notes for v2.7.0 — resolve duplicates, helmet configuration,
  version check infrastructure, and more!
id: b70247c4-5307-4d61-8b4e-c9b588ec7e5b
publishedAt: 2026-04-07
slug: v2.7.0-release
title: Release v2.7.0
---

Welcome to Immich `v2.7.0`!

This release includes enhancements to the asset viewer, security improvements, changes to the duplicate APIs and viewer, and a bunch of bug fixes. Keep reading below for the complete highlights and a note on the upcoming `v3.0.0` release.

## Highlights

- Remove from album (asset viewer)
- Move to locked folder (folder page)
- Editor shortcuts
- Create a new face on-the-fly in the face tag editor
- Resolve duplicates
- Helmet configuration
- Version check infrastructure
- Notable fix: live photo and video download in Safari
- Notable fix: escape HTML in the Panorama Photo Viewer

### Remove from album

The web has a new action, "Remove from album," available in the asset viewer that makes it easier to remove an asset from an album. This action is available to both album and asset owners.

![](https://static.immich.cloud/blog/b70247c4-5307-4d61-8b4e-c9b588ec7e5b/7b37dcc0cbe7bb5222325c3f08007ef8.webp)

### Move to locked folder in the Folder view

Similarly, the folder view now includes the "Move to locked folder" action.

![](https://static.immich.cloud/blog/b70247c4-5307-4d61-8b4e-c9b588ec7e5b/33185ed2bfdfe2c2da349250f75aab30.webp)

### Editor shortcuts

Users on the web can now edit with keyboard shortcuts. Press `e` to open the editor. Once in the editor, press `[` or `]` to rotate the asset +/- 90 degrees. Finally, save any changes and close the editor with `ENTER`.

<video autoplay src="https://static.immich.cloud/blog/b70247c4-5307-4d61-8b4e-c9b588ec7e5b/ac8f9af46a776728a6c21fbf3ad9256f.mp4" controls>Your browser does not support the video tag.</video>

### Create a new face on-the-fly in the face tag editor

You can now create a new face/person on the fly from the face tagging editor interface

![](https://static.immich.cloud/blog/b70247c4-5307-4d61-8b4e-c9b588ec7e5b/86baa1aeb6ec1872378f10e603f098e5.webp) ![](https://static.immich.cloud/blog/b70247c4-5307-4d61-8b4e-c9b588ec7e5b/4600371f78aa2b04feb76728955a727c.webp)

### Deduplication improvements

The duplicate screen has gone through a bunch of iterations since it was first introduced all the way back in May, 2024. The latest release moves a bunch of logic from the client to the server, which now automatically suggests which asset to keep based on image size and EXIF data. Additionally, the new server implementation will automatically synchronize metadata, including albums, favorite status, rating, description, visibility, location, and tags. For more information about this process, see the new [documentation](https://docs.immich.app/features/duplicates-utility).

### Helmet configuration

You can now opt in to using a [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) in Immich. The new environment variant `IMMICH_HELMET_FILE` accepts a boolean or a path to a [helmet](https://helmetjs.github.io/) configuration file.

**Recommend action:** The team recommends setting `IMMICH_HELMET_FILE=true` to enable the default policy. Then, please let us know if you run into any issues with it.

#### Background and details

Since Immich is deployed in so many different ways, it has been hard to figure out how to enable a CSP that would not conflict with or break existing installs that might use 3rd party map providers, custom CSS, embed Immich in an iframe, or other such features. In this release, we have added the ability to both opt in to a default policy and configure a custom one. To use the default policy, simply set the environment variable `IMMICH_HELMET_FILE=true`. To use a custom policy, set the environment variable to a path on disk (within the immich-server) that contains a valid helmet configuration (e.g. `IMMICH_HELMET_FILE=/opt/immich/helmet.json`). CSP can be used to control what scripts are allowed to run on the page, which domains to load images from, etc. Additionally, it can be used to configure headers for [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy), [X-Powered-By](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Powered-By), [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options), and others.

### New version check infrastructure

Prior to this release, instances that used the automatic version check feature would send HTTP requests to `github.com`. Now, we have set up a small service at `version.immich.cloud` to handle these types of requests. This avoids any privacy implications of connecting to `github.com` , as well as moves the request load to our own infrastructure.

### Notable fix: live photo and video download in Safari

When downloading files in Safari with the same name, it will simply overwrite the file instead of automatically renaming it. In this release, the still and motion parts of a live photo are now named differently to prevent this from happening.

### Notable fix: escape HTML in panorama photo viewer

In `v2.6.0`, we added the ability to show/view clip text in the panorama viewer, but introduced an XSS vulnerability, which has been fixed in this release. Interestingly, this was XSS using text in the image, which would then get read by OCR.

### Notable fix: Immich User Agent for external requests

Similar to the mobile app, the server now sends a custom [User Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent) header. The format for the User Agent is `immich-server/{version}`. For example, `immich-server/2.7.0`.

## `v3.0.0`

Just a heads up that this is the likely to be the last release before `v3.0.0`. Being a major release there will be a handful of breaking changes, _although it's worth noting that nothing is currently planned that requires user intervention_. It is mainly changes that impact 3rd party developers. More information and details should be available in the coming weeks.

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed

### 🚀 Features

- feat: add support for helmet configuration by @jrasm91 in <https://github.com/immich-app/immich/pull/27058>
- feat: create new person in face editor by @alextran1502 in <https://github.com/immich-app/immich/pull/27364>

### 🌟 Enhancements

- feat(web): add a seperate tooltip for switching from dark to light mode by @Vogeluff in <https://github.com/immich-app/immich/pull/27297>
- feat(web): focus on face-editor search input by @cratoo in <https://github.com/immich-app/immich/pull/27136>
- feat(web): add RemoveFromAlbumAction to asset viewer nav bar by @timonrieger in <https://github.com/immich-app/immich/pull/27000>
- feat(web): add shortcuts to rotate images by @squishykid in <https://github.com/immich-app/immich/pull/26927>
- feat(server): add checksum algorithm field by @etnoy in <https://github.com/immich-app/immich/pull/26573>
- feat(server): resolve duplicates by @Phlogi in <https://github.com/immich-app/immich/pull/25316>
- chore(mobile): reduce spacing on video controls by @uhthomas in <https://github.com/immich-app/immich/pull/27313>
- perf(server): optimize people page query by @ffchung in <https://github.com/immich-app/immich/pull/27346>
- feat(web): dim photo outside hovered face bounding box by @midzelis in <https://github.com/immich-app/immich/pull/27402>
- feat(web): OCR overlay interactivity during zoom by @midzelis in <https://github.com/immich-app/immich/pull/27039>
- feat: add move to lock folder in folder view by @alextran1502 in <https://github.com/immich-app/immich/pull/27384>
- feat(web): highlight active person thumbnail in detail panel and edit faces panel by @midzelis in <https://github.com/immich-app/immich/pull/27401>
- feat: move version checks to our own infrastructure by @zackpollard in <https://github.com/immich-app/immich/pull/27450>

### 🐛 Bug fixes

- fix(server): refresh unedited asset dimensions on metadata extraction by @michelheusschen in <https://github.com/immich-app/immich/pull/27220>
- fix(server): memory fragmentation by @mertalev in <https://github.com/immich-app/immich/pull/27027>
- fix(database restores): don't assume onboarding has completed by @insertish in <https://github.com/immich-app/immich/pull/27052>
- fix(web): preserve timezone when changing timestamp (Closes #25354) by @updatemike in <https://github.com/immich-app/immich/pull/27095>
- fix: various command palette usages by @danieldietzler in <https://github.com/immich-app/immich/pull/27304>
- fix(web): keep map view open after closing asset viewer by @diiogofer in <https://github.com/immich-app/immich/pull/26980>
- fix(web): prevent Safari from overwriting live photo image with video by @saurav61091 in <https://github.com/immich-app/immich/pull/26898>
- fix(mobile): video icon not showing on memories by @YarosMallorca in <https://github.com/immich-app/immich/pull/27311>
- fix(mobile): mismatch between system and app color when using low-chroma system color scheme by @putuprema in <https://github.com/immich-app/immich/pull/27282>
- fix(mobile): images loads sometimes cancel too early by @LeLunZ in <https://github.com/immich-app/immich/pull/27067>
- fix(mobile): streamline error handling for live photo saving by @LeLunZ in <https://github.com/immich-app/immich/pull/27337>
- fix(web): keep upload totals stable when dismissing items (#27247) by @Nicolas-micuda-becker in <https://github.com/immich-app/immich/pull/27354>
- fix(mobile): low upload timeout on android by @mertalev in <https://github.com/immich-app/immich/pull/27399>
- fix(web): add drop shadow to asset viewer nav bar and prevent button shrinking by @midzelis in <https://github.com/immich-app/immich/pull/27404>
- fix(mobile): favorite button not updating state by @YarosMallorca in <https://github.com/immich-app/immich/pull/27271>
- fix: detection of WebM container by @chanb22 in <https://github.com/immich-app/immich/pull/24182>
- fix(web): prevent AssetUpdate from adding unrelated timeline assets by @michelheusschen in <https://github.com/immich-app/immich/pull/27369>
- fix: withFilePath select edited or unedited file by @bwees in <https://github.com/immich-app/immich/pull/27328>
- fix(web): Enable stack selector in shared album view by @timonrieger in <https://github.com/immich-app/immich/pull/24641>
- fix(server): use substring matching for person name search by @okxint in <https://github.com/immich-app/immich/pull/26903>
- fix: escape html by @jrasm91 in <https://github.com/immich-app/immich/pull/27469>

### 📚 Documentation

- feat(docs): add keycloack example to oauth docs by @robson90 in <https://github.com/immich-app/immich/pull/27425>

### 🌐 Translations

- chore(web): update translations by @weblate in <https://github.com/immich-app/immich/pull/27029>

## New Contributors

- @Vogeluff made their first contribution in <https://github.com/immich-app/immich/pull/27297>
- @updatemike made their first contribution in <https://github.com/immich-app/immich/pull/27095>
- @diiogofer made their first contribution in <https://github.com/immich-app/immich/pull/26980>
- @squishykid made their first contribution in <https://github.com/immich-app/immich/pull/26927>
- @Phlogi made their first contribution in <https://github.com/immich-app/immich/pull/25316>
- @saurav61091 made their first contribution in <https://github.com/immich-app/immich/pull/26898>
- @putuprema made their first contribution in <https://github.com/immich-app/immich/pull/27282>
- @ffchung made their first contribution in <https://github.com/immich-app/immich/pull/27346>
- @chanb22 made their first contribution in <https://github.com/immich-app/immich/pull/24182>
- @robson90 made their first contribution in <https://github.com/immich-app/immich/pull/27425>
- @okxint made their first contribution in <https://github.com/immich-app/immich/pull/26903>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.6.3...v2.7.0>
