---
authors: [Immich Team]
coverAlt: Bird sitting on a branch surrounded by green leaves
coverAttribution: Photo by bo0tzz
coverUrl: https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/2d7c03fd816e50d70646f5509737e720.webp
description: A recap of July 2026, including an update on upcoming features,
  releases, developer updates, and more.
id: d8e152fd-80ec-48f0-bd97-637ad320c588
publishedAt: 2026-07-31
slug: 2026-july-recap
title: July recap
type: recap
---

Hello everyone!

We released `v3`! Our first major release since the stable release `v2`. Before releasing `v3.0.0`, we went through four _release candidates_. We haven't done release candidates before, so this was a first, and we had to tweak various pieces of our workflow to make it possible. In the end, it was a success — it went well, and we got great feedback from early testers. Thanks again to everyone who ran a release candidate version!

Keep reading below to find out more about recent workflow updates, roadmap progress, release branches, and more!

## Workflows updates

Since the release, we have gotten great feedback in the workflows feature request discussion [#29167](https://github.com/immich-app/immich/discussions/29167). We have already shipped a couple of new filters: asset date filters, EXIF filters, and the ability to filter by upload path instead of just filename. Currently, we are working on two bigger, highly requested workflow triggers: an added-to-album trigger and a face-recognized trigger. With these two triggers, it should make it possible to implement person-based smart albums and some other sharing-related workflows.

![Filter by EXIF metadata step configuration options](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/10dbcaddcbeb9bfa7cab1e4029e0f70b.webp)

We still have plenty of ideas ourselves about which triggers, filters, and actions we want to support. However, if you have an idea and it hasn't been mentioned in the aforementioned discussion, please bring it up there. We will continue to monitor that discussion to make sure we don't miss anything.

## Roadmap updates

![Real-time transcoding and HTTP live streaming items from the roadmap](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/60e8290cc8d0155f0d0894e28eccbb19.webp)

We have technically released a version of HLS and Workflows, but we have decided to wait until they are a little more feature complete before marking them as “done” on the roadmap.

![Better sharing item from the roadmap](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/6705d06c5131d5c17ea7c1e6cf761066.webp)

It’s worth noting that we are also making progress on better sharing, albeit with some major hurdles. However, we think we have a plan to allow sharing facial data with other users that will address most of the requested use cases, so that continues to be “Coming Soon™️”.

## Release branches

Our current development process is pretty straightforward. The team continually merges pull requests into the `main` branch. Then, when we are ready to cut a release, we run a GitHub workflow which automatically creates the release on GitHub, attaches the release artifacts to the release, builds and pushes Docker images, sends out notifications, etc. One downside to this approach, which we have started to suffer from, is that merging to `main` essentially grinds to a halt for a few days after each release as we wait to see if any big issues show up. This delay has been worse with the recent major release, reaching the multi-week level. All of this to say we’re revisiting our release strategy as a team with the goal to be able to continue to work while still having the ability to do quick patch releases. In short, we’re going to start having release branches like `release/3.0`, `release/3.1`, etc. This will allow us to continue to merge changes to `main` and then selectively cherry-pick changes as needed for patch releases.

## Welcome `agg23`!

Immich is really good at a lot of things, but the area we struggle with the most is definitely mobile development, which is why it is exciting to introduce `agg23`, the newest member of the Immich team. They are a senior mobile developer, and since joining the team, they have started to help clean things up, starting with removing generated code from the git repository. This has resulted in a _crazy_ amount of code removal (\~350,000 lines of code!). Moving forward, they will help get the mobile codebase under control before moving on to more exciting work like user experience design, polish, and adding new features.

![Remove over 270,000 lines of drift generated code](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/c947d780802068557dd6b87ec1590189.webp)

![Remove over 70,000 lines of Open API generated code](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/eb8e391843fbd968f50c9968ba48d862.webp) ![Remove over 7,000 lines of pigeon generated code](https://static.immich.cloud/blog/d8e152fd-80ec-48f0-bd97-637ad320c588/893732d23f652e0cddff72bbb5778d8f.webp)

## Releases

We published 1 major and 1 minor release this month:

- [v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0) - New merch, release candidates, mobile editing, workflows, recently added, and more!
- [v3.1.0](https://github.com/immich-app/immich/releases/tag/v3.1.0) - Undo archive, OIDC role sync, bug fixes, and more!

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

This month, I have primarily focused on keeping an eye out for the second major release, helping with testing, spotting issues on mobile, and identifying priorities for issues that we need to resolve. We have been so busy over the last couple of months, since the start of the summer, with onboarding new team members and interns, major releases, bug fixes, new workflows, and new procedures.

We have started focusing on individual team members' wellness and personal development through one-on-one meetings that we are now having once per month. Meeting individual team members has resulted in great feedback that helps us identify bottlenecks and problems in team functioning and communication. So we are going in the right direction.

I am seeing my role with the team has been manifesting into a general manager/director role; I don’t do a lot of day-to-day code contribution anymore, and I delegate a lot to the team, and the team is rocking at it. I do have some secret features and shininess in mind, though, which I hope to take a stab at soon.

As the summer is coming to an end, we will be saying goodbye to our three interns, Ben, Brandon, and Will. They have been making great contributions over the short period of time they have been with the project; let’s wish them the best for the next school year.

### @jrasm91

I was actually out of office most of the month, but I did revamp the search feature on the immich.app website before I left. It is now possible to do fuzzy searching on all of the blog posts, which is super nice. Eventually the goal is to migrate docs.immich.app from the React-based framework it uses (docusaurus) to the Svelte-based one we used to build immich.app. There are still a few gaps that need to be addressed before we get to that point, one of which has been search.

Also this month, I rewrote the whole “pump script”, which is in charge of bumping version references across the whole codebase during a release. It used to be a combination of Bash and JavaScript, but it’s now completely ported to TypeScript and expanded to handle automatically bumping some references in our documentation as well ([#29331](https://github.com/immich-app/immich/pull/29331)). It’s funny how a simple request to “also bump the reference in this documentation page” turned into a 1,000+ line rabbithole :laughing:.

### @danieldietzler

This month, I mostly worked on bug fixes post-v3. I also coordinated the patch releases thereafter. Once the patch phase was over, there were _a lot_ of PRs that we had to go through that have been ignored for a while. We managed to get a lot of them in and are slowly making our way through the large pile. Apologies to everyone who is still waiting to get a review on their pull request! Things have been busy.

Whenever I could, I also continued working on the sharing rework. Unfortunately, I just recently ran into a major blocker with regards to mobile sync. I am now thinking about how to resolve this and in which ways we can implement sharing for this to not be a problem.

### @shenlong

The majority of this month was spent cleaning up the various actions a user can perform in the mobile app. The idea is to refactor each one into a self-contained class, independent of how it's rendered. It got really close to being merged several times, but each time we spotted improvements and kept refactoring, eventually landing on something the entire team is happy with. Actions are now structured, clean, and testable. As a bonus of this - the delete buttons, of which there were mysteriously several, are now one delete button. Just the one. It deletes things.

A bug that has been haunting the mobile app since the new timeline release was a drifted migration that left us asking users to reset their local app database to fix it. It turned out to be a missing transaction during the migration all along, and I'm glad we finally got to fix it this month. We had spent months assuming migrations ran in a transaction, the way you assume the floor is there when you step out of bed. The floor was not there. It is now.

I also got to work on a new onboarding page for the mobile app that walks users through a guided setup on a fresh install, so permissions and backup are sorted up front instead of dropping you straight into an empty timeline and hoping you find the settings. Beyond that: more cleanups, a lot of discussions, and a leaner, cleaner codebase

## Next month

Well, that's it for this month. Next month we hope to figure out a better release strategy that doesn’t block the team so much, continue to iterate on workflows, and _finally_ deliver something related to better sharing.

As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>
