---
authors: [Immich Team]
coverAlt: Docker Compose Builder tool with options panel and sample
  docker-compose.yml preview
coverHeight: 1308
coverSrcset:
  https://static.immich.cloud/blog/a3da7469-4b7f-4be9-bd6b-0a10eeb50b25/b9a9a78dbda07f713795e43c8770ebc4-720.avif
  720w,
  https://static.immich.cloud/blog/a3da7469-4b7f-4be9-bd6b-0a10eeb50b25/b9a9a78dbda07f713795e43c8770ebc4-1080.avif
  1080w,
  https://static.immich.cloud/blog/a3da7469-4b7f-4be9-bd6b-0a10eeb50b25/b9a9a78dbda07f713795e43c8770ebc4-1440.avif
  1440w,
  https://static.immich.cloud/blog/a3da7469-4b7f-4be9-bd6b-0a10eeb50b25/b9a9a78dbda07f713795e43c8770ebc4-2119.avif
  2119w
coverUrl: https://static.immich.cloud/blog/a3da7469-4b7f-4be9-bd6b-0a10eeb50b25/b9a9a78dbda07f713795e43c8770ebc4-2119.avif
coverWidth: 2119
description: An overview of Docker Compose Builder, a new tool for building
  compose files for Immich.
id: a3da7469-4b7f-4be9-bd6b-0a10eeb50b25
publishedAt: 2026-09-25
slug: docker-compose-builder
title: Docker Compose Builder
type: post
---

<script> 

  import { Button } from '@immich/ui'; 

  import { mdiOpenInNew } from '@mdi/js'; 

</script>

Hello again!

We recently released a new tool for building a `docker-compose.yml` file for Immich! We’re calling it: [Docker Compose Builder](https://immich.app/docker-compose-builder). If you haven’t seen it or tried it out yet, you can access it at <https://immich.app/docker-compose-builder.> There is also a GitHub Discussion (<https://github.com/immich-app/immich/discussions/31232>) about the topic if you have any feedback for the team. It’s only been out a few weeks so we’re constantly improving it based off of community feedback.

---

<Button fullWidth color="secondary" href="https://github.com/immich-app/immich/discussions/31232" trailingIcon={mdiOpenInNew}>Join the discussion</Button>

---

## Motivation

The motivation for building a tool like this ultimately came from a desire to reduce the issues and confusion we see around the `docker-compose.yml` file, which are MANY. Most of the issues and confusion stem from the fact that we use an `.env` file in conjunction with `docker-compose.yml`. This setup seems to introduce several foot guns in addition to other inconveniences. The Docker Compose Builder tool is an attempt to remove the `.env` file entirely from the `docker-compose.yml`, while also centralizing Immich deployment best practices and common patterns, which currently exist scattered around the Immich docs, GitHub discussions, issues, release notes, or in support threads on Discord.

### Environment variables in compose files

Some environment variables are used in the old `docker-compose.yml` file for _templating_. The following example uses `IMMICH_VERSION`, although many are used across the file:

```typescript
services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
```

In this example the `immich-server` tag can be controlled or set dynamically based off of the value of `IMMICH_VERSION`. Docker Compose will automatically read a sibling `.env` file and will load and use variables from it, in addition to any others available in the current shell. While this is nice in theory it actually introduces a bunch of different problems. More on that below.

### Polluting the container

The first problem is that the `immich-server` container also passes _the same_ `.env` file to the container directly:

```yaml
env_file:
  - .env
```

Any environment variables used for _templating_ now also get passed into the `immich-server` container.

There have been some cases where users used an environment variable, like `PORT` or `HOST` in their _template_, but since it was _also_ passed into the container it changed the container’s behavior leading to unintended consequences which were difficult to understand. This is one of the motivations to migrate our `PORT` environment variable to `IMMICH_PORT`. Obviously, if we could avoid this whole class of problems in the first place that would be even better.

### Volume templates

There are some _templating_ environment variables that are used on the left side of volumes such as `UPLOAD_LOCATION`.

```yaml
volumes:
  - ${UPLOAD_LOCATION}:/data
```

What would happen if you tried to start up containers referencing a volume that didn’t have a value? Well, you get errors like this:\n

> WARN\[0000] The "UPLOAD\_LOCATION" variable is not set. Defaulting to a blank string.
>
> WARN\[0000] The "DB\_DATA\_LOCATION" variable is not set. Defaulting to a blank string.
>
> invalid spec: :/var/lib/postgresql/data: empty section between colons

For many users it is not _clear_ what this error message means. Also, the fact that unset environment variables default to a blank string can further lead to unexpected consequences.

Really, there should _always_ be an `UPLOAD_LOCATION` and probably it should be inlined/hard-coded directly into the `docker-compose.yml` file itself, not dynamically “rendered” based on environment variables and whether it is correctly set in another file or not.

### Support requests

We get a lot of support requests from Immich users who are running into some type of problem. Normal protocol usually involves asking for the `docker-compose.yml` file and `.env` file. Often times settings or misconfigurations in these files are the culprit and the first thing we check when investigating the issue. Users sometimes have a hard time locating or copying the `.env` file, especially since it is considered a “hidden” file on most file managers.

### Hidden `.env` file

File managers on most operating systems consider a file “hidden” if it starts with a leading dot. This is obviously true for `.env`. Especially in the Windows operating system’s file manager the option to see hidden files is hidden away, making it difficult to view, edit, or move the file. In fact, we have had many users try to move the `docker-compose.yml` file to another directory, but completely forget about the `.env` because they didn’t see it, leading to their install not starting up, or starting up with wrong configuration making it look like all their data was GONE.

## Solution

As you can see, there are a lot of “problems” that originate from how we use the `.env` file in our `docker-compose.yml`. While there are a few different ways to address some of the specific issues, we thought it would be good to just have a clicky-pointy online tool for it.

The team can easily and quickly update and maintain a website — we already know how to do that. The tool has a configuration box that basically replaces what used to be in the `.env` file, except that we now have access to other form elements like checkboxes, dropdowns, etc. We can also dynamically show or hide options as needed.

Probably the most important part about this whole thing is that it generates a single file version of `docker-compose.yml` (no `.env` file!), which we hope will make it easier for users to get started with Immich. The motivation for this has always been to simplify running and maintaining Immich and we hope this tool can play a small part in that.

---

<Button fullWidth color="secondary" href="https://immich.app/docker-compose-builder">Open Docker Compose Builder</Button>

---

Like most things we do, this is open source. It is licensed under the terms of the MIT license and [available on GitHub](https://github.com/immich-app/static-pages/tree/main/apps/root.immich.app/src/lib/compose). Feel free to use GitHub issues to report problems or pull requests to submit changes, and don’t forget to [let us know](https://github.com/immich-app/immich/discussions/31232) if you have any feedback.

Special shout out to [bo0tzz](https://github.com/bo0tzz) who revived this project and pushed it to the finish line in <https://github.com/immich-app/static-pages/pull/660>!
