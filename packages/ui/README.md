# @immich/ui

A component library for [Immich](https://immich.app), written in [Svelte](https://svelte.dev).

## Install

```bash
npm i -D @immich/ui
```

## Usage

Import components from `@immich/ui`. For example:

```html
<script lang="ts">
  import { Card, CardBody, CardHeader, CardTitle, CardDescription, Heading, Text } from '@immich/ui';
</script>

<Card>
  <CardHeader>
    <CardTitle>@immich/ui</CardTitle>
    <CardDescription>A component library</CardDescription>
  </CardHeader>
  <CardBody>
    <Lorem />
  </CardBody>
  <CardFooter>Privacy should not be a luxury</CardFooter>
</Card>
```

## Contributing

PR's are welcome! Also feel free to reach out to the team on [Discord](https://discord.immich.app).

```
mise install             # install pnpm, npm, etc.
pnpm install             # install deps
pnpm -w watch            # automatically rebuild `@immich/ui` on changes
cd apps/ui.immich.app
pnpm start               # view component documentation and examples
```

## Technology

- [Svelte](https://svelte.dev)
- [tailwindcss](https://tailwindcss.com)
- [Material Design icons (@mdi/js)](https://pictogrammers.com/library/mdi/)
