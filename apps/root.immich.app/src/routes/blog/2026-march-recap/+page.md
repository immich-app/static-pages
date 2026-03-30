---
authors: [Immich Team]
coverAlt: ''
coverAttribution: Photo by <a href="https://unsplash.com/@_entreprenerd" class="underline">Arno
  Smit</a> on <a href="https://unsplash.com/photos/low-angle-photo-of-cherry-blossoms-tree-sKJ7zSylUao"
  class="underline">Unsplash</a>
coverUrl: https://static.immich.cloud/blog/5b54d5d9-ee80-4d49-b9a9-63b99269bc89/e958c4d0e338f0447c75f2e08d2369b4.webp
description: A recap of March, 2026, including an update on upcoming features, releases,
  developer updates, and more.
id: 5b54d5d9-ee80-4d49-b9a9-63b99269bc89
publishedAt: 2026-03-31
slug: 2026-march-recap
title: March recap
---

Hello everyone!

March was a great month for the team. Most of us were able to fly out to Austin, Texas, for FUTO's [Don't Be Evil](https://futo.tech/blog/dont-be-evil-conference-2026) conference during [SXSW](https://sxsw.com/). It's always fun to meet together in person, and we did some fun team-building activities. Besides the conference, we also had a few releases and continued working on some upcoming features. Continue below to read the full recap.

## FUTO backups survey

FUTO started building an encrypted backup service this year and they plan to integrate it directly into Immich. They are currently running a [survey](https://futo-backups-survey.immich.app/) to gather information about setups, library sizes, hardware & network capabilities, etc. Please fill out the survey if you haven't already. Also, if you are interested in joining the closed beta later this year there is a place to leave your email address.

## Don't Be Evil

At the Don't Be Evil FUTO conference Alex used Immich to give a presentation about Immich, which included what's changed since last year, and what's planned for this year. The presentation was recorded and should be available soon™️ on FUTO's [Youtube channel](https://www.youtube.com/@FUTOTECH). You can also find the slides [here](https://immich.futo.org/s/sxsw26-slides), on our public Immich instance. One take away from the presentation was that Immich is where it is today because of the awesome community and external contributors, so thank YOU!

![Alex presenting at Don't Be Evil](https://static.immich.cloud/blog/5b54d5d9-ee80-4d49-b9a9-63b99269bc89/249afd36d04b9e0d1c7a7112e67a6615.webp)

## Releases

We published 1 minor release this month:

- [v2.6.0](https://github.com/immich-app/immich/releases/tag/v2.6.0) - Album covers, shared link slugs, and native HTTP clients on mobile, `schema-check` command, and OAuth claims in `idToken`

## Developers update - from the labyrinth

_Our team members' unfiltered thoughts on the good, the bad, and the frustration about the current tasks they are working on._

### @alextran1502

Recently, I've seen an increase in vibe-code projects trying to implement some features or mechanisms that the team hasn't gotten to yet. While those projects seem interesting, after looking at the code, many shortcomings and questions arose for vibe-code implementation that I don't think an LLM agent can understand correctly, which could degrade the experience or rack up huge billing costs for users from those external integrations.

As someone who cares so much about the experience and the feeling about using the app as a whole, from every pixel and alignment, how the font size and the colors should look for the project, seeing those projects get implemented is like witnessing something close and personal to me get butchered into Frankenstein style.

### @jrasm91

This month I spent a decent amount of time going through bug reports and was able to fix a handful of items, worked on adding [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) support, and made some progress on workflows and plugins.

#### Bug fixes

I fixed one [issue](https://github.com/immich-app/immich/issues/25193), which I thought was pretty interesting. A user was getting this strange error message when trying to use the CLI:

```typescript
TypeError: image is not iterable
```

It turns out the error was caused by the Immich server returning `HTML` where `JSON` was expected and then the client basically coerced it to a `string` for _reasons_, eventually leading to this runtime error. Once I had figured out what was happening the solution was pretty straightforward: return a [406 Not Acceptable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/406) response, instead of a [200 OK](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200). Basically, if the client is _requesting_ `application/json`, don't response with `text/html`. In hindsight, it seemed so obvious :smile:.

#### Helmet

I also worked on making it possible to configure the Immich server with [helmet](https://github.com/helmetjs/helmet), a library for managing security headers, such as `Content-Security-Policy` , `Strict-Transport-Security`, etc. There will be more information about this feature in `v2.7.0`.

#### Workflows & plugins

This is turning out to be a pretty big feature to build. I made a lot of progress this month on dynamic configuration, which means that we can generate entire forms from JSON configuration, which is important because configuration options are defined on a per plugin method basis.

```typescript
{
  "name": "immich-plugin-core",
  "version": "2.0.1",
  "title": "Immich Core Plugin",
  "description": "Core workflow capabilities for Immich",
  "author": "Immich Team",
  "wasmPath": "dist/plugin.wasm",
  "methods": [
    {
      "name": "filterFileName",
      "title": "Filter by filename",
      "description": "Filter assets by filename pattern using text matching or regular expressions",
      "types": ["AssetV1"],
      "schema": {
        "type": "object",
        "properties": {
          "pattern": {
            "type": "string",
            "title": "Filename pattern",
            "description": "Text or regex pattern to match against filename"
          },
          "matchType": {
            "type": "string",
            "title": "Match type",
            "enum": ["contains", "regex", "exact"],
            "default": "contains",
            "description": "Type of pattern matching to perform"
          },
          "caseSensitive": {
            "type": "boolean",
            "default": false,
            "title": "Case sensitive",
            "description": "Whether matching should be case-sensitive"
          }
        },
        "required": ["pattern"]
      }
    },
    ...
}
```

This configuration, for example, generates something like this in the web application now:
<img alt="Dynamic configuration modal" src="https://static.immich.cloud/blog/5b54d5d9-ee80-4d49-b9a9-63b99269bc89/24d2f3ba0b285c4ea60dd8461e513da7.webp" class="max-w-md mx-auto my-4 w-full border rounded-xl"/>

Now that dynamic configuration exists, I'll be moving on to writing tests for the core plugin, and looking into additional triggers, like `PersonRecognized`.

### @danieldietzler

For me, besides flying out to Austin for a week, March has been mostly around chores. Briefly peaking at >200 open PRs, I had (and still have :sweat_smile:) lots of review work to do. But don't get me wrong; I strongly appreciate every single contribution, and I love that so many people find joy in working on the Immich code base. Barely being able to keep up with contributions is definitely one of the better problems to have! :P

Other than that, I fixed some bugs and updated a bunch of packages.

Notably, I was finally upgrade Kysely, our SQL query builder of choice, to its latest version. Hidden behind a small `fix(helpers)`, [0.28.3](https://github.com/kysely-org/kysely/releases/tag/v0.28.3) changed the return types of nested queries. Now, for a selected JSON column (e.g., from a sub-select), the fields in that object can only be strings, numbers, objects, arrays, or booleans. After all, that's the types JSON supports. For instance, there is no concept of something like a JavaScript `Date`.

However, both our previous ORM as well as [Kysely](https://kysely.dev/) on versions `<= 0.28.2` did type those fields based on their actual types. This resulted in our code base relying on wrong types forever basically, causing it to be deeply spread within all of Immich server. After a bunch of prior refactoring to untangle our types, primarily in unit tests (which led me down a path of refactoring most of our unit tests in fact), I was finally able to upgrade Kysely in [#26744](https://github.com/immich-app/immich/pull/26744) with a somewhat reasonable diff (it's still not the prettiest, but prior attempts were horrible in comparison lol). We didn't have to give up any type safety, and I didn't have to elude to any ugly casts. :tada:

### @bwees

This month I made some more progress on the editing experience in Immich. My goal for the past 2 months has been to fix some of the limitations in the editing feature.

#### Mobile editing

The new mobile editing experience is in its final stages of review and should be coming soon to a phone near you :tm:. We merged the majority of underlying requirements for mobile editing (websocket events, sync entities, API changes) for `v2.6.0`. The only part that remains in the new user interface.

#### Live Photo editing

I made some significant headway on bringing editing support to Live Photos. This will allow you to edit an image that includes a live video portion and have the edits apply to both parts (photo and video). The changes in the PR also lay the groundwork for full video editing support in the future.

#### Retro DVD source release

![Retro DVD](https://static.immich.cloud/blog/5b54d5d9-ee80-4d49-b9a9-63b99269bc89/0ae9786ad8bd154cb0500bd1f1fa8b1a.webp)

We recently sold the remaining retro DVDs from our [stable release](https://immich.app/blog/stable-release) back in October. As such, we have released the source code for building the Alpine Linux based ISO that was burned onto the DVDs. You can check out the source code at <https://github.com/immich-app/retro>!

I worked on this project all the way back in August of 2025. It was the last week of my summer internship with Immich and originally started as a "Wouldn't it be funny if…." joke. I did some digging on how to make a bootable live DVD and I had a working image by the end of the week!

Huge shoutout to Zack for setting up the fulfillment pipeline to take orders from our [merch store](https://immich.store/) and forwarding them on to the DVD vendors in both the US and Europe. In addition we gave the option to purchase a product key with your DVD.

![While the team was at FOSDEM 2026, we met Daniel Stenberg (creator of curl) and gave him a retro DVD! ](https://static.immich.cloud/blog/5b54d5d9-ee80-4d49-b9a9-63b99269bc89/1d2f3ad99eacc9f4ab53414ab2093e0c.webp)

We sold over 500 DVDs since they were released! This was a super fun project to work on and now I, along with many others in the community, have a cool piece of Immich history!

## Upcoming goals

Looking forward into April, we hope to have a final `v2.7.0` release, and then start work on `v3`, which will include a handful of API breaking changes, and:crossed_fingers: hopefully an initial release of workflows!

Well, that's it for this month. As always, if you find the project helpful, you can support us at <https://buy.immich.app/.>
