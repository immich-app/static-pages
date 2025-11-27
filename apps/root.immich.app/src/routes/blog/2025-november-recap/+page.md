---
id: b5734354-7296-4289-b26a-2d8cfe402ef3
title: November recap
description: A recap of November, 2025, including an update on workflows, releases, developer updates, and more.
publishedAt: 2025-11-27
authors: [Immich Team]
coverUrl: https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/4c2f7e9b747be705e53aa858ebe7a309.webp
coverAlt: Fall colored leaves hanging from a string
coverAttribution: Photo by <a href="https://unsplash.com/@chrislawton?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Chris Lawton</a> on <a href="https://unsplash.com/photos/assorted-color-lear-hanging-decor-5IHz5WhosQE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
---

Hello everyone!

November draws to a close, and it's time for another project update. It's been a busy month here at Immich and the team has been hard at work. Since our [last update](/blog/2025-october-recap) we've made a lot of progress on workflows, building a database restore flow for the web, support for crop & rotation, as well as some improvements to the mobile app.

## Workflows

Workflows is something the whole team is super excited about. The goal is to enable users to build their own features and automations. We're working on providing the building blocks that will enable use cases such as:

- Automatic albums (smart albums)
- Automatic sharing
- Automatic archiving
- Custom notifications
- Webhooks
- And much more

Alex has been hard at work building out the feature. The initial backend work was merged in [#23621](https://github.com/immich-app/immich/pull/23621) and he has moved onto the UI, which you can track in [#24190](https://github.com/immich-app/immich/pull/24190). Below is a preview of what it looks like today.

### Trigger

Each workflow will run in response to a triggering event, like asset upload.

![Workflow trigger](https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/a045ca1e4befbcebb7a37143b48425a5.webp ' =1042x349')

### Filter

Each workflow can include one of more filters, which can decide if the event should be processed or skipped.

![Workflow filter](https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/396dfe40a3b7e157c3a907f2f6324afe.webp ' =1045x850')

### Action

Each workflow can have one or more actions that run on the triggering event. In this example we archive the asset and add it to a Screenshots album.

![Workflow action](https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/4e66545026d747aa4b9814196f05d699.webp)

There is still a lot of work to do, but we're definitely making good progress. The power of workflows will ultimately come as we add more triggers, filters, and actions, so stay tuned.

## Command palette

We're also incorporating a command palette into the web project, making it easier to navigate, discover keyboard shortcuts, and more. You can expect to see more about this in the next release.

![Command palette](https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/576e0da01f867b4db7ad001bb7e53c4a.webp)

## Infinite update loop

With the release of [v2.3.0](https://github.com/immich-app/immich/releases/tag/v2.3.0) we also ran into a _wild_ bug ([#24009](https://github.com/immich-app/immich/issues/24009)). The bug only affects instances running 2.2.x, and it wasn't a problem _until we released v2.3.0_. The act of releasing a minor release activated the bug in the previous version and caused an infinite loop with the new releases popup on the web project for admin users. It made the webpage become unresponsive for no obvious reason. It was a devastating combination with the only recourse being to upgrade to the latest release because you then avoid the popup entirely, since there is no longer a newer version. In the future we plan to improve the version check logic so when the feature is disabled it avoids all of these code paths.

## Releases

We published 1 minor release this month:

- [v2.3.0](https://github.com/immich-app/immich/releases/tag/v2.3.0) - OCR improvements, delete synchronization (Android), maintenance mode

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

Working on a new feature is fun, but working with color shades isn't. Since we are starting to refactor previous components into the new UI library, we need to follow a set of rules, including color shades, to ensure the app has a consistent feel across the board. My spontaneous nature took a big hit when it came to using the colors introduced in the UI library. I've always wanted to use more colors in the app to make it more personable. Still, instead of using random colors and their shades everywhere, I need to remember to use the color palettes introduced by the UI library. Jason has been the one who has been hard on me, for the better :D I thank him every day, immensely.

In the season of thankfulness, I never imagined I would be able to work with such an incredible team and interact with so many cool people. I am very thankful for every one of you, from the bottom of my heart. I feel like it's been a long journey, but Immich is just starting to gain recognition in a larger community. I am hopeful that we will have an application that will help everybody relive and back up their precious memories without the worry or fear of an end-of-life announcement coming out of nowhere.

Happy Thanksgiving!

### @jrasm91

This month I have mostly been working on code cleanup. I love to refactor and make things easier to maintain, and there never seems to be a shortage of work in that area **😄**. I've also built or helped build a few new UI components in our [UI library](https://ui.immich.app/). New components this month include: [badge](https://ui.immich.app/components/badge), [breadcrumbs](https://ui.immich.app/components/breadcrumbs), [context menu](https://ui.immich.app/components/context-menu), [toast](https://ui.immich.app/components/toast), [progress bar](https://ui.immich.app/components/progress-bar), and [date picker](https://ui.immich.app/components/date-picker). In addition to that I have been working on some minor UI tweaks in the web. The shared links, users and library pages all have some minor improvements.

### @mertalev

This month, I made some refinements to OCR after the initial feature launch, including support for other languages and improvements in its memory usage and performance. Stay tuned for more improvements to come in this area!

I've also made some significant headway in overhauling the upload process of the app, which is not yet released. This is targeting iCloud users in particular to improve the backup experience, but will have benefits for everyone (faster uploads, lower storage use, higher reliability, etc.). As this involves much more native Swift/Kotlin code as opposed to the typical Flutter code of the app, there are interesting challenges in coordinating things like database access and the sync process as a whole. The end result should bring us much closer to taking advantage of the newly released Background Upload Extension API, as well as introducing resumable uploads.

A side effect of this work is that we may end up using a custom SQLite build in the app, meaning we can include custom extensions ranging from vector search to geospatial processing. As part of our transition to a local-first app, I'd love to enable users to search even without internet.

### @danieldietzler

While the server code base undergoes frequent refactorings and cleanup, web has always been a bit of a mess and didn't get as much love as it deserved. @jrasm91's work on the UI library is one major factor to improving the web code base in general, but it only tangentially improves the logic in Immich web. Even simple pieces are often implemented in a complex, hard to understand way, scattered across multiple files. This not only negatively impacts readability, but also makes testing harder.

I am now working my way through Immich web, cleaning Immich web up and making the more complex parts easier to understand, where possible. Besides readability and testing benefits, I also find (performance) bugs from, e.g., overly complex reactivity. As I go and things become simpler, we can also add new features such as the command palette we will introduce soon. For now it has a limited scope, but it'll extend as I continue refactoring and cleaning up more pages.

### @bwees

This month I completed some mobile bug fixes and introduced location editing to the new timeline. I also helped get the [new "add to" menu](https://github.com/immich-app/immich/pull/23608) merged in from one of our external contributors: [@happychriss](https://github.com/happychriss). I love seeing new features be added by external contributors and the unique implementations they come up with!

I started work on image editing inside the Immich interface. This has been a long requested feature and I'm looking forward to bringing it to the Web and eventually the mobile app. This new editing system will be non-destructive to the original asset and edits can easily be stacked and reverted.

There are some interesting side effects to editing an image (specifically crops, rotates, and mirrors). Specifically, face detection and OCR store bounding boxes in the original asset's coordinate space. When modifying an image, the bounds of an image might change and require transformation of the bounding boxes to still align with faces and text. This has lots of edge cases so it is taking some time to work through each and verify test cases.

If you are curious, here is a short video from very early in the development! Don't worry, the plan is to have a nice editing UI available on web and mobile so you don't have to call the API 😂.

<video alt="Screen recording from early development" controls>
  <source src="https://static.immich.cloud/blog/b5734354-7296-4289-b26a-2d8cfe402ef3/bb0cfc34792b89272f045cd220375532.mp4" type="video/mp4">
</video>

## Upcoming goals

In addition to workflows, we're actively working on database restores and an image editor that can support crop & rotate on the web. Also, we're excited to take some time off for the holidays 🎉.

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
