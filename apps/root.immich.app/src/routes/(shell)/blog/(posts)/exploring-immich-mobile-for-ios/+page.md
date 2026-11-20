---
authors: [Immich Team]
coverAlt: ''
coverHeight: 2622
coverSrcset:
  https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/540b6269f125b1a1c82f094d073aa014-720.avif
  720w,
  https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/540b6269f125b1a1c82f094d073aa014-1080.avif
  1080w,
  https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/540b6269f125b1a1c82f094d073aa014-1206.avif
  1206w
coverUrl: https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/540b6269f125b1a1c82f094d073aa014-1206.avif
coverWidth: 1206
description: Requesting feedback for native iOS prototype
id: 98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453
publishedAt: 2026-11-20
slug: exploring-immich-mobile-for-ios
title: Exploring Immich Mobile for iOS
---

# Exploring Immich Mobile for iOS

Greetings, I am Adam ([agg23](https://github.com/agg23)), the newest addition to the Immich team, where I work on mobile. The Immich team has been growing (two new engineers in the past \~6 months), allowing us to allocate more resources into making the Immich mobile experience even better. We have a number of projects being explored in parallel at the moment, and today I would like to show off our proof of concept of a native iOS app.

&#x20;<Markdown.Image src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/aaa6d164d25227b17b210031ccb81046-1206.avif" srcset="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/aaa6d164d25227b17b210031ccb81046-720.avif 720w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/aaa6d164d25227b17b210031ccb81046-1080.avif 1080w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/aaa6d164d25227b17b210031ccb81046-1206.avif 1206w" width="1206" height="2622" alt="" title="left-50 =223x2622" />

## Why Change?

Immich mobile is built using [Flutter](https://flutter.dev), a cross-platform framework for building applications. Flutter has a number of nice properties that have allowed us to work very quickly, developing the Immich app to what it is today with only one or two core contributors. However Flutter has some downsides, such as no native HDR support, non-native UI/interactions, and general performance issues. These are things we could work on solving through Flutter, but we wanted to investigate more of our possible options.

On top of these problems, Flutter exists as "odd platform out" on iOS. It _works_ right out of the box, but Flutter does all of its own drawing and doesn't react well to platform changes, as we recently saw with the release of iPhone Duo. When Duo was announced, we immediately noted problems in Immich with safe areas and unconventional control placement. These are at least partially our fault, and partially Apple's fault, but the fact that we have to revisit scenarios like this weighs on us and any solution we may build. Along similar lines, we cannot support HDR without patching a native view into Flutter, as Flutter doesn't support the higher color space, which hurts our image viewing experience significantly.

A native version of Immich solves these problems for "free" and lets us focus on building new, interesting features rather than reacting to a third-party platform.

## Introducing Immich Native for iOS

After considering our options for solving problems like HDR support and iOS UX particulars, I began prototyping how we might reimagine Immich if it was specifically built for Apple platforms. We are thinking a lot about our visual identity and the desired user flow (for example, how can we improve on proprietary platform’s viewing experiences?). Due to the ease of human building, most of the UI is built in SwiftUI, with the critical sections (read the timeline and animations) written in UIKit. Automated tooling seems to prefer UIKit, however, so we may reconsider this as time goes on. The native iOS UI is built around a compiled core library (Rust) containing all of our logic, state, server interaction, etc., which is largely a new construction.

We’re still early on, so what you see in this post is a proof of concept only; do not expect it to represent our final intention, design, or performance targets for the project.

<Markdown.Image src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/df451981ee6d1a9b7b4e8024208f535b-1430.avif" srcset="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/df451981ee6d1a9b7b4e8024208f535b-720.avif 720w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/df451981ee6d1a9b7b4e8024208f535b-1080.avif 1080w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/df451981ee6d1a9b7b4e8024208f535b-1430.avif 1430w" width="1430" height="2846" alt="" title="left-50 =255x1423" />

<Markdown.Image src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/c4bbf0be3bbc5bf8f25b36b01e4d1f51-1206.avif" srcset="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/c4bbf0be3bbc5bf8f25b36b01e4d1f51-720.avif 720w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/c4bbf0be3bbc5bf8f25b36b01e4d1f51-1080.avif 1080w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/c4bbf0be3bbc5bf8f25b36b01e4d1f51-1206.avif 1206w" width="1206" height="2622" alt="" title="left-50 =222x2622" />

<Markdown.Image src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/79a8b75dc9a1be28798cb45e6e923361-2160.avif" srcset="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/79a8b75dc9a1be28798cb45e6e923361-720.avif 720w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/79a8b75dc9a1be28798cb45e6e923361-1080.avif 1080w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/79a8b75dc9a1be28798cb45e6e923361-1440.avif 1440w, https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/79a8b75dc9a1be28798cb45e6e923361-2160.avif 2160w" width="2160" height="1620" alt="" title="left-50 =498x2064" />

## What's New?

Revisiting Immich from the perspective of the Apple design language gives us new opportunities to think about what the Immich design philosophy should be, especially with our different-than-corporate goals of being privacy-centric and self-hosted. We value consistency, so we don't want to change things just to change them, but we also don't want to artificially limit ourselves if there's a better alternative. For example, this has led into conversations about where and how to surface memories in the app. Memories are one of those key emotional parts of Immich that we want to drive people towards, but at the same time we don't want to get in our users' way.

The app is very early, but we're already seeing some nice benefits:

- HDR just works
- Native video playback (a source of a number of problems on the Flutter side)
- High performance scrolling and zooming. We want our experience to be as fluid and “out of your way” as possible
- Most of the UI is built in SwiftUI, enabling a new class of developers to contribute to the project
- Accessibility comes to us for free. VoiceOver functions in the app. Tests can identify textfields on the screen (yes, this is a real problem with the Flutter app)

Additionally, we have some other core goals that we are working towards:

- "Fitting in" with iOS while having our own “Immich feel”
- Offline support
- Strong test infrastructure
- Sharing between platforms

We haven’t done much performance optimization, but this is what scrolling around on an uncached 200k picture library looks like:

<video autoplay src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/0064b044e5b0065b54654c73b7e8d5dc.mp4" controls>Your browser does not support the video tag.</video>

<video autoplay src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/38927ba84bd1bf7e4e72d432b8631496.mp4" controls>Your browser does not support the video tag.</video>

This may not make it into the final product, but I'm particularly happy with this new animation:

<video autoplay src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/0d717ddb130372442ffdd466b4798e74.mp4" controls>Your browser does not support the video tag.</video>

## What's Next?

We still don't have a huge team, so this is going to be a process that takes some time. We plan to begin offering this app via TestFlight as soon as we have a minimum feature set, and it will remain under a different bundle ID for the duration of its testing period (thus allowing you to use normal Immich and this new app side by side). It will be merged into [the main monorepo](https://github.com/immich-app/immich) relatively soon alongside the current mobile apps. Of course as soon as it's in the repo, you will be able to build and play with it yourself regardless of TestFlight.

One of our big goals is to make backup as solid as possible. It has been a journey for Immich to handle the ever changing quirks of iOS backgrounding and `PhotoKit` access. I want to take our years of experience and funnel them into building a testing solution that gives us more confidence over the sync and backup mechanisms. As we get to revisit these segments of the codebase, the opportunity arises to fix long standing bugs (and introduce new ones), so hopefully we see some big improvements here quickly.

I have a lot of work to do to polish Immich's mobile UX. I want to make the experience as smooth as possible for the user; making it very clean and intuitive. iPhone Duo has some very fun and interesting problems to design for that I've been experimenting with in my free time, and I'm excited to see how we can make Immich the best photo viewer for Duo (amusingly, Apple Photos _regressed_ with 27.2 on the Duo, so maybe beating them isn't so hard).

This is a fun Duo experience I’ve been playing with and haven’t seen anywhere else:

<video autoplay src="https://static.immich.cloud/blog/98f0e20c-c9fb-4a6d-bf0e-2d5f5979f453/7a8a61d7d9fdaa0e2569f6226cde7832.mp4" controls>Your browser does not support the video tag.</video>

## What About Android?

Despite all of this talk about iOS, we want Immich Flutter (Android) to get the same share of attention. The native iOS app is built against a shared FFI core, which we plan on eventually sharing with Immich Flutter. This is work we were already planning on regardless of this iOS project, but it fits together with this PoC nicely. Once this work is completed, all of the new performance and stability goodness we’re building for iOS will come to Android for free.

Android will be (eventually) getting all of the rewritten and tested logic as we begin to share more and more code. We don't have the resources to overhaul the app for two platforms at once, and iOS makes it very obvious when something is not done the "Apple" way, so we’re starting in that direction. We may pursue native Android UI based on the success of this venture, but we also may take the learnings from this project and use them to improve our existing Flutter codebase.

## Tell Us What You Think

We are very interested in your feedback. We do not take rebuilding the mobile app lightly, but after some thought and experimentation we think this is the best path forward.

- What would you like to see in a revamped mobile app?
- What works well in the current Immich mobile app?
- What annoys you in Immich on mobile currently, and how do you think the app could better address it?
- What is a key feature that you think might be missed in a version 1?
- Is there something key that has not been addressed here or by the current Immich app?
- What would you prioritize?

Any comments you provide will factor into our decision making as the project continues. Our community is our largest asset and we strive to build the best experience for everyone.
