# Static sites

## Structure

This repository structure is as follows

```
apps/      <-- web apps
packages/  <-- npm packages
```

## Setup

Install [Mise](https://mise.jdx.dev/installing-mise.html) and then activate it via `mise install`.

## Mise commands

This `mise dev` command watches both `packages/ui` and `packages/svelte-markdown-preprocess` for changes and rebuilds them automatically. It also launches a svelte-kit development server for the selected app, or `root.immich.app` if unspecified.

```
mise dev                 # launches root.immich.app
mise dev <app>           # launches <app>.immich.app

# examples
mise dev api
mise dev awesome
mise dev buy
mise dev get
mise dev my
mise dev root
mise dev ui
##
```
