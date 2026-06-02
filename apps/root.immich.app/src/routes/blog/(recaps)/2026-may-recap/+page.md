---
authors: [Immich Team]
coverAlt: My not-quite-so-ripe blueberries
coverAttribution: Photo by Jason
coverUrl: https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/016e29e2b34704831dc8d15cc51e1708.webp
description: A recap of May, 2026, including an update on upcoming features, releases,
  developer updates, and more.
id: 84a0ba7d-ed36-4044-a20b-b0d7018b1d47
publishedAt: 2026-05-29
slug: 2026-may-recap
title: May recap
---

Hello everyone!

While May was a relatively quiet month, there are a few updates that we are excited to share. We have started to build out support for release candidates (a.k.a prereleases), have made great progress on Workflows, HLS, and better sharing, and we also just had both our 100,000th star and 10,000th commit to the repository! Keep reading below for more details on all this and more.

## Release candidates

As we get closer to releasing `v3.0.0` we thought it would make a lot of sense to finally get around to building out a process for release candidates. A release candidate (RC) is a feature-complete, tested, release that is published ahead of the final version, allowing additional users to uncover any final bugs before the official, stable version is published.

![The system settings with an option to select the release candidate channel](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/7b91e9f0182673819fedc9c36e84976a.webp)

## 100,000th Star :star:

We acknowledge there is a decent amount of controversy around stars on GitHub, how to get them, what they mean, and if they are "real" or not. Putting all that aside, it is still fun to see the counter go up. To the team, stars simply represent a metric that tracks interest in the project.

:::tip
See the full chart on [data.immich.app](https://data.immich.app/)
:::

## 10,000th Commit

It is kind of crazy to see the 10,000th commit in the Immich repository. I remember seeing nodejs go over 10,000 commits back in 2014 when I started my career and thinking "now _that_ is a serious project". It's so awesome to be able to work on Immich everyday, and be apart of such an awesome community. Here's to the next 10,000 commits!

## Recent uploads

Many of you have been long asking for a view where you can see all the assets you just uploaded so that you can easily bulk-edit and categorize them. We're happy to report that this finally made it into main this month!

![The recently added row on the explore page](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/506cac03b562c148a8bd4d8e5dce01c8.webp)

The `/explore` page has gotten a new "Recently added" row, with a "view all" button that provides you a timeline sorted by upload date. At the moment this still has some performance issues for huge uploads, however we figured this is still great to have already. As you know us, we'll keep iterating on it until it's blazingly fast. :rocket:

## Workflows

You have already seen some early screenshots of workflows in previous blogs and release notes, but there are a few things that have changed since then.

### List view

The workflow page can be accessed from the utilities page, and here's what it looks like now. Workflows can have a title, description, be disabled, and configured on the detail page.

![Workflow page with a few example workflows](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/5f22137542ff89b4aa01875836b77f24.webp)

Since the last update we have also added the "Browse templates" button. Templates are pre-built workflows that act as a starting place for new workflows. There are only two templates at the moment, but we plan to add more here as additional triggers, filters, and actions are built.

![Workflow template list](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/322107841da3e184a6984dea45fe5e79.webp)

### Editor

The workflow editor has also had a few changes, and this is what it looks like now. It has both a visual and JSON view. Each workflow has a trigger, and then a list of steps. A step is made up of an filter or action and any associated configuration. The interface supports reordering steps via drag-and-drop, which is pretty nice. Lastly, a workflow also supports copying and downloading, so that you can easily share them with other users. At some point we would love to build out some type or marketplace or registry where users can browse existing templates.

![The workflow editor show an example workflow ](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/ebfd6445da664e2a3d83b54ae77fe573.webp)

### Step actions

The bread and butter of workflows will be the actions you can configure in each step. Similar to triggers and templates we only have a handful of actions at the moment, but we plan to continue to add more in the coming weeks.

![The current list of available workflow actions and  filters](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/f9014a229e27c4fcf391221a1c707eaa.webp)

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

Hey hey, we might have found the cause _and_ the fix for a bug that occasionally cause the database on the mobile app to be locked up in the background and when you open the app, it appears like the app does not respond. It happens rarely but has been one of the hard to reproduce bug for the last few months. I am very happy about this particular news.

Besides, seeing the team head down to focus on V3 release have been great, now we need to push hard for testing to make sure the release won't be too bumpy.

### @jrasm91

I actually was on vacation for a week this month, which was great. I brought my laptop but didn't actually end up using it at all, which is how I hear it is supposed to be :laughing:. Outside of that I have actually spent a lot of time working on plugins & workflows with Alex. I'm pretty happy with where it is at now. The next steps for me is adding whatever triggers, actions, and filters are needed to support the most popular workflow/smart album related feature requests.

I always do a lot of boring, maintenance work too. In May, some of that included:

- Migrate immich-app/packages to immich-app/static-pages
- Migrate immich-app/ui to immich-app/static-pages
- Update `@immich/svelte-markdown-preprocess` to support markdown admonitions/alerts
- Migrate GitHub actions, build scripts, and development configuration from `make` to `mise`
- Add a few milestones to the <https://immich.app/roadmap>

Actually, I just checked my commits to the main repository and it's almost exclusively workflow/plugin work or maintenance stuff :smile:. Maybe next month I'll work on more bug fixes & features :crossed_fingers:

![My recently merged commits in the immich-app/immich repository](https://static.immich.cloud/blog/84a0ba7d-ed36-4044-a20b-b0d7018b1d47/c7a4841e9754c5917d6a1a6c68d29219.webp)

### @danieldietzler

This month, my primary focus was on the sharing rework. After running against a rather significant wall, we've decided on a new design for people sharing and so far this seems to be promising. I am hoping to start properly implementing the first pieces of the rework in the next month, and finally leave the proof of concept phase.

In addition to continued work on sharing, I also worked on refactorings as well as cleaning up some deprecated APIs. Furthermore, I made <https://version.immich.cloud,> the Immich server, and Immich web work with prereleases (you know, a release candidate kind of thing like `v3.0.0-rc.0`). We're planning to publish release candidates for v3 and any future major version. Since we haven't done something like that before, many components didn't support this properly, thus needing adapting and testing.

Lastly, I helped reviewing and providing feedback on some of those other huge features, especially workflows :)

## Upcoming goals

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/>.
