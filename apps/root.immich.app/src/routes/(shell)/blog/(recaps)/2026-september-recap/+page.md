---
authors: [Immich Team]
coverAlt: Two cats watching each other in the grass
coverAttribution: Photo by bo0tzz
coverHeight: 1440
coverSrcset:
  https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/5318c8f9d932167215e159c76df1785e-720.avif
  720w,
  https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/5318c8f9d932167215e159c76df1785e-1080.avif
  1080w,
  https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/5318c8f9d932167215e159c76df1785e-1440.avif
  1440w,
  https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/5318c8f9d932167215e159c76df1785e-2160.avif
  2160w
coverUrl: https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/5318c8f9d932167215e159c76df1785e-2160.avif
coverWidth: 2160
description: A recap of September, 2026, including an update on upcoming
  features, releases, developer updates, and more.
id: 65652088-0af4-45ac-8821-c661e0aaf53a
publishedAt: 2026-09-30
slug: 2026-september-recap
title: September recap
type: recap
---

<script> 

  import { Button } from '@immich/ui'; 

  import { mdiOpenInNew } from '@mdi/js'; 

</script>

Hello everyone!

Another month, another recap. This time we have some exciting news about people and face sharing, which is available in our latest [release candidate release](https://github.com/immich-app/immich/releases), and expected to be released in v3.3.0 next week. In other news, we released a [Docker Compose Builder](https://immich.app/docker-compose-builder), have some incoming album improvements, and are celebrating [one year since going stable](https://immich.app/blog/v2.0.0-release)! Keep reading below for more details on all this and more.

## Person Sharing

On our endeavor of revamping sharing features in Immich, we finally support person sharing properly now. In `v3.2.0` we introduced cluster groups, which allow your own people to show up in shared assets, and we mentioned that in last month's recap post. While being foundational, it was pretty limiting and led to quite a bit of confusion. With this recent batch of improvements we hope everything is a lot easier to understand, simpler to use, and ultimately more powerful.

### Try it today

The v3.3 release is scheduled for next week, but release candidate builds are available to try today. Feedback is welcomed and encouraged. It's easier to make changes before it's released so let us hear your thoughts!

### Share all people

You can now share access to all of your people with users in your cluster group. With shared access turned on you see the combined list making it easier to view and manage people.

### Shared people management

A common use case for sharing access to people is the idea that multiple users could work together to add names and birthdays. Or, one person could do it for everyone 😂. The access management features we've been working on are bi-directional, meaning you can control who has read vs write access to your people.

## Docker Compose Builder

We started working on a web-based docker compose builder a while ago, and then just never got around to finishing it. This month we finally managed to pick it back up again (thanks bo0tzz!) and push it over the finish line.

The Docker Compose Builder is a tool that simplifies generating a `docker-compose.yml` that works for your requirements and environment. In the past we used a `.env` file for some customization, but that only led to confusion around how templating with environment variables works. With everything now in the `docker-compose.yml` file, we were able to simplify the deployment while also providing a simple way to obtain an customized configuration.

---

<Button fullWidth color="secondary" href="https://immich.app/docker-compose-builder" trailingIcon={mdiOpenInNew}>Try it out!</Button>

---

If you are interested in learning about the details, we wrote a blog post covering the new tool: <https://immich.app/blog/docker-compose-builder>

<Markdown.Image src="https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/ca3230ffa75569b05e1b773a010333c5-1229.avif" srcset="https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/ca3230ffa75569b05e1b773a010333c5-720.avif 720w, https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/ca3230ffa75569b05e1b773a010333c5-1080.avif 1080w, https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/ca3230ffa75569b05e1b773a010333c5-1229.avif 1229w" width="1229" height="1175" alt="Docker Compose Builder tool with options panel and sample docker-compose.yml preview" />

## Album improvements

(jrasm91) Funny story last week — my parents were in town visiting and asked for a bit of help doing some tasks in Immich. Really they just wanted to both make sure all their pictures from a recent trip were added to a shared album. My mom asked me how she could change the album name (to match the one from last year). I told her if she was added to the album as an editor she should be able to do that. Welllllllllll, it turns out that the web and mobile app both only let the album owner change the title or description, even though the album API (the Immich server) specifically allows editors to do those actions. All of this to say: album editors can now also edit the album titles and descriptions. 🎉

## Long live ESM! (maybe)

:::warning
Long technical rant about the JavaScript module system 😛

:::

In Node, there are two different types of modules. CommonJS (CJS) modules and ECMAScript Modules (ESM). CJS has been the default for a long time. Even though ESM is the modern successor with many improvements, migration to it is slow and painful due to incompatibility.

<Markdown.Image src="https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/2c2457f18826ae6225b24c3c61ffc06b-1718.avif" srcset="https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/2c2457f18826ae6225b24c3c61ffc06b-720.avif 720w, https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/2c2457f18826ae6225b24c3c61ffc06b-1080.avif 1080w, https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/2c2457f18826ae6225b24c3c61ffc06b-1440.avif 1440w, https://static.immich.cloud/blog/65652088-0af4-45ac-8821-c661e0aaf53a/2c2457f18826ae6225b24c3c61ffc06b-1718.avif 1718w" width="1718" height="1227" alt="Distribution of ESM and CJS packages by @wooorm: https://github.com/wooorm/npm-esm-vs-cjs" />

With the release of [NestJS 12](https://github.com/nestjs/nest/releases#release-v12.0.0), they finally introduced ESM support. We were eager to migrate, as we have been accumulating more and more annoyances (for instance, importing CJS from ESM from CJS seems broken, in case you were curious) with the CJS server. An increasing number of projects have actually migrated to ESM-only releases. As such, we ran into some edge cases as we’ve started to need to importing more and more ESM packages while still running as CJS.

Besides some initial hurdles with tsconfig `paths` resolution due to an upstream bug in `@nestjs/cli` and some issues with `tsc-alias`, the migration went pretty flawless and was done in less than a day.

If you are interested, here is the PR: <https://github.com/immich-app/immich/pull/31237.> The changes turned out to be rather minimal and straightforward.

## Roadmap update

Similar to last month, our focus is still on better sharing so that we can finally tick off that roadmap item eventually. But it’s not quite time for that yet ;)

## Releases

This month included the `v3.2.0` release, as well as four follow-up patch releases. We also released two release candidates for `v3.3.0` so far, and plan to release `v3.3.0` next week.

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

It has been very great to see the implementation of people sharing taking shape, and the feedback from early adopters of the feature. I went back to do some research on how “the-app-which-must-not-be-named” or “the-high-wall-orchard-garden-app” handles face sharing, and surprisingly, none of those applications have this feature. I was under the impression that users asking for this feature because they have used it elsewhere. Anyway, I am very proud that Immich is the first major photos management application that implements this feature extensively, and after seeing all the complexity of the work, it makes sense that it is not a trivial feature to add for other applications. Big kudos to the team.

As birthday season coming up, I thought it would be cool to also show them in memory as it get closers to a person’s birthday, so you get into the mental stage how fast time has passed since you know the person, to appreciate the moment more. I hope you guys will like the birthday memories implementation in this release. I plan to also add more type of memories as we go for the next couple of releases as well.

### @jrasm91

Similar to Daniel, person sharing/management changes have taken up most of my time this month. As I was thinking about it this week I realized that I don't know of any photos management system out there that has facial recognition features that allow cross user sharing and management. I am personally quite excited to be able to see tagged faces of my kids, especially since my wife is the one that takes most of those pictures. Seeing shared and owned assets together for specific people may very well be a game changer for Immich compared to other competitions. Other than that I also helped a bit with the Docker Compose Builder project and some minor clean up and refactoring tasks.

### @danieldietzler

This month has been very busy for me. Besides some small side quests such as the ESM migration of Immich server, I spent most of my time with person sharing/management changes. With cluster groups, we had the biggest technical issue solved. However, the UX challenges we had to face this month for person sharing weren't any simpler either 😅. As often, it turns out that making something very powerful seem simple isn't an easy task.

Since we are writing this post very last minute (did I already mention things have been busy?), this is it for my update this month :D

## Upcoming goals

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>

## Next month

Well, that's it for this month. Next month we plan to tune and enhance people sharing features, and probably look into PostgreQL 18/19 migration.

As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>
