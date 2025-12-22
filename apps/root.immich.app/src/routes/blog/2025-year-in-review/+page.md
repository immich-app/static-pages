---
{ authors: [Immich Team], description: A review of the major milestones accomplished
    in 2025., id: 153e5050-88b9-43e7-8b7b-ef0c0438057d, publishedAt: 2025-12-22, slug: 2025-year-in-review, title: 2025 - A year in review }
---

<br/>

Hello everyone!

As we approach the holidays, we wanted to take a moment to look back at the past year with all of you. There's something about working on Immich that makes time feel... different. A year somehow feels like three. Days blend into weeks, weeks into months, and suddenly we look back and realize just how much we have done.

We crossed the 1.5-year mark since becoming FUTOnians, and we still feel incredibly grateful for where we are. The whole team gets to work on what we love, every single day. That's not something most people get to say, and we don't take it for granted.

This year, we brought on more people full-time, some from within the Immich core team and others from outside the community. The team is growing, and so is the project's scope as we work to make it the best self-hosted photo management system out there.

![Immich Team (Chris, Zack, Jason, Alex, Paul, Daniel, Ganka, Mert, missing the Boet and the intern, Brandon :P)](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/3bd14c69eb2d20ea68a1b4d15325716e.webp 'Immich Team (Chris, Zack, Jason, Alex, Paul, Daniel, Ganka, Mert, missing the Boet and the intern, Brandon)')
<i class="text-xs">Immich Team (LTR: Chris, Zack, Jason, Alex, Paul, Daniel, Ganka, Mert, missing the Boet and the intern, Brandon :P)</i>

So let us walk you through what "three years in one" actually looked like.

## All I wanted for last Christmas was "Stable"!

Since the beginning of the year, we have set a stable version of Immich as our team's development priority. We knew it would be a journey, and the team came together in ways that we're all so proud of, tackling challenges and roadblocks to finally deliver it on October 1st.

Three major technical overhauls defined the year's goal

**1. Database Modernization**

We rebuilt how Immich's server talks to the database, the core system that pieces everything together. We migrated the entire server database-fetching mechanism to a new library that gives us more control over how we interact with data, while still providing a superb developer experience. This results in rewriting ALL the database queries on the server.

**2. Streaming Sync Infrastructure**

With the new database foundation in place, we could finally build a mechanism to continuously stream data from the server to the mobile app, rather than a single large request. This required creating entirely new data-streaming capabilities on the server, enabling your server and mobile app to handle the data flow efficiently. This is one of the most complex works to date; it requires handling when the data changes, determining what should be sent to the server, and in what order.

**3. Mobile App Rewrite**

The old mobile app wasn't designed for this new sync approach. So we rewrote it from the ground up. The entire user interface was rebuilt, and critically, all sync operations now happen in the background. No more waiting for the data sync to finish or watching the app freeze; the data is synced seamlessly while you continue browsing your library.

Each of these steps came with its own set of challenges, requiring countless hours of discussion, debugging, and iteration. The team showed incredible dedication, working through problems together via chat, voice calls, and late-night troubleshooting sessions.

---

Despite this heavy foundation work, we still managed to ship an incredible amount of new features and improvements.

- 85 new features
- 200 enhancements to existing features
- 290 bug fixes

Here are some highlights from those improvements:

- HDR video support with our native video player
- Search by tags and descriptions
- Manual face tagging for better organization
- Folder view in the mobile app
- QR codes for shared links
- Persistent memories that don't disappear
- Improved external library scanning
- Customizable nightly job scheduling
- Enhanced map features with points of interest
- Multiple admin account support
- Mobile app widgets for your home screen

  ![Mobile app home screen widget](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/e96b877a4b325f08f940a597727a101b.webp)

- Granular API key permissions for power users
- Large file management utility
- Custom URLs for shared links
- Private/locked photos feature

  ![Pin code creation for locked view](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/4f1c5d5e7c0ebf1eef1029301e340650.webp)

- "View similar photos" discovery
- GPS utility for location management
- Google Cast support![A casting session](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/3c2dc2fb1944a9cca8d2a1ea8d9d084b.webp)
- Background backup improvements
- Optical character recognition (OCR)

  ![OCR viewer](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/158116d921f3cb7e859b9067428eb76d.webp)

- Digital Ocean 1-Click deployment
- ...and much more

## Websites

Looking back over the year, it turns out we also did a decent amount of work _outside_ of Immich as well.

Here is a list of websites that we launched throughout the year:

- https://immich.app/ — New homepage & blog
- https://immich.store — Merch with a new mascot, Mich
- https://data.immich.app/ — Data website with fancy charts
- https://api.immich.app/ — New API documentation

  ![api page](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/a10bde6c0546fd82843a08b003978d7e.webp ' api page')

- https://ui.immich.app/ — Svelte UI component library

  ![immich ui library page](https://static.immich.cloud/blog/153e5050-88b9-43e7-8b7b-ef0c0438057d/1a7ef7f4f4c322182d56bfd5a6b14ce5.webp 'immich ui library page')

- https://awesome.immich.app/ — A list of awesome apps, integrations, tools, distributions, and guides

## Fun Statistics

- Grew from **55,000** stars to **87,000** stars on GitHub
- **1** major release, **25** minor releases (v1.124 -v1.144 & v2.0 — v2.4)
- **35,000+** Discord members and 42,000+ Reddit member
- **8,800+** commits of love, sweat, and occasional tears
- **~1700** contributors
- **~2930** commits to main in this year, meaning we have gone through the review process for the same number of PR

## Hello, 2026!

Looking ahead to 2026, we are excited to continue building Immich into the best self-hosted solution for photo and video management, with new features and services that deliver data sovereignty, privacy, and the peace of mind that comes with self-hosting.

Sneak peak about some of the features that _might_ get delivered in January

- Workflows
- Restore database from the web UI
- Integrity check

---

None of this would have been possible without our incredible community. Thank you for being so patient during the bumpy period, for your detailed bug reports, your feature suggestions, and your creative contributions.

On behalf of FUTO, we wish you a peaceful and joyful holiday season. We will wind down on GitHub and Discord activity for the rest of the year to recharge, collect more memories, and come back strong in 2026.

_And as always, if you find the project helpful, you can support us at <https://buy.immich.app/.>_
