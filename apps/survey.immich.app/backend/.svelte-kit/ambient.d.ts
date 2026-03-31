// this file is generated — do not edit it

/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 *
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 *
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 *
 * **_Private_ access:**
 *
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 *
 * For example, given the following build time environment:
 *
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 *
 * With the default `publicPrefix` and `privatePrefix`:
 *
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 *
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 *
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
  export const SHELL: string;
  export const npm_command: string;
  export const COREPACK_ENABLE_AUTO_PIN: string;
  export const PYTHONUNBUFFERED: string;
  export const TERMINAL_EMULATOR: string;
  export const I3SOCK: string;
  export const LC_ADDRESS: string;
  export const LC_NAME: string;
  export const npm_config_verify_deps_before_run: string;
  export const TERM_SESSION_ID: string;
  export const MEMORY_PRESSURE_WRITE: string;
  export const LC_MONETARY: string;
  export const XCURSOR_SIZE: string;
  export const XDG_SEAT: string;
  export const PWD: string;
  export const XDG_SESSION_DESKTOP: string;
  export const LOGNAME: string;
  export const XDG_SESSION_TYPE: string;
  export const SYSTEMD_EXEC_PID: string;
  export const DESKTOP_STARTUP_ID: string;
  export const NoDefaultCurrentDirectoryInExePath: string;
  export const _VOLTA_TOOL_RECURSION: string;
  export const ENABLE_IDE_INTEGRATION: string;
  export const CLAUDECODE: string;
  export const MOTD_SHOWN: string;
  export const HOME: string;
  export const LC_PAPER: string;
  export const LANG: string;
  export const RUSTICL_ENABLE: string;
  export const XDG_CURRENT_DESKTOP: string;
  export const MEMORY_PRESSURE_WATCH: string;
  export const SWAYSOCK: string;
  export const WAYLAND_DISPLAY: string;
  export const __MISE_DIFF: string;
  export const VIRTUAL_ENV_DISABLE_PROMPT: string;
  export const MANROFFOPT: string;
  export const TF_VAR_dist_dir: string;
  export const INVOCATION_ID: string;
  export const pnpm_config_verify_deps_before_run: string;
  export const VOLTA_HOME: string;
  export const __MISE_ORIG_PATH: string;
  export const CLAUDE_CODE_SSE_PORT: string;
  export const XDG_ACTIVATION_TOKEN: string;
  export const XDG_SESSION_CLASS: string;
  export const TERM: string;
  export const LC_IDENTIFICATION: string;
  export const CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
  export const USER: string;
  export const __MISE_SESSION: string;
  export const MANPAGER: string;
  export const DISPLAY: string;
  export const SHLVL: string;
  export const GIT_EDITOR: string;
  export const LC_TELEPHONE: string;
  export const npm_config_manage_package_manager_versions: string;
  export const LC_MEASUREMENT: string;
  export const XDG_VTNR: string;
  export const XDG_SESSION_ID: string;
  export const npm_config_user_agent: string;
  export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
  export const DISABLE_AUTOUPDATER: string;
  export const PNPM_PACKAGE_NAME: string;
  export const XDG_RUNTIME_DIR: string;
  export const NODE_PATH: string;
  export const CLAUDE_CODE_ENTRYPOINT: string;
  export const DEBUGINFOD_URLS: string;
  export const LC_TIME: string;
  export const MISE_SHELL: string;
  export const PATH: string;
  export const DBUS_SESSION_BUS_ADDRESS: string;
  export const MAIL: string;
  export const LC_NUMERIC: string;
  export const OLDPWD: string;
  export const TEST: string;
  export const VITEST: string;
  export const NODE_ENV: string;
  export const PROD: string;
  export const DEV: string;
  export const BASE_URL: string;
  export const MODE: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 *
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 *
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 *
 * **_Public_ access:**
 *
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 *
 * For example, given the following build time environment:
 *
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 *
 * With the default `publicPrefix` and `privatePrefix`:
 *
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 *
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 *
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 *
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 *
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 *
 * **_Private_ access:**
 *
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 *
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 *
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 *
 * For example, given the following runtime environment:
 *
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 *
 * With the default `publicPrefix` and `privatePrefix`:
 *
 * ```ts
 * import { env } from '$env/dynamic/private';
 *
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
  export const env: {
    SHELL: string;
    npm_command: string;
    COREPACK_ENABLE_AUTO_PIN: string;
    PYTHONUNBUFFERED: string;
    TERMINAL_EMULATOR: string;
    I3SOCK: string;
    LC_ADDRESS: string;
    LC_NAME: string;
    npm_config_verify_deps_before_run: string;
    TERM_SESSION_ID: string;
    MEMORY_PRESSURE_WRITE: string;
    LC_MONETARY: string;
    XCURSOR_SIZE: string;
    XDG_SEAT: string;
    PWD: string;
    XDG_SESSION_DESKTOP: string;
    LOGNAME: string;
    XDG_SESSION_TYPE: string;
    SYSTEMD_EXEC_PID: string;
    DESKTOP_STARTUP_ID: string;
    NoDefaultCurrentDirectoryInExePath: string;
    _VOLTA_TOOL_RECURSION: string;
    ENABLE_IDE_INTEGRATION: string;
    CLAUDECODE: string;
    MOTD_SHOWN: string;
    HOME: string;
    LC_PAPER: string;
    LANG: string;
    RUSTICL_ENABLE: string;
    XDG_CURRENT_DESKTOP: string;
    MEMORY_PRESSURE_WATCH: string;
    SWAYSOCK: string;
    WAYLAND_DISPLAY: string;
    __MISE_DIFF: string;
    VIRTUAL_ENV_DISABLE_PROMPT: string;
    MANROFFOPT: string;
    TF_VAR_dist_dir: string;
    INVOCATION_ID: string;
    pnpm_config_verify_deps_before_run: string;
    VOLTA_HOME: string;
    __MISE_ORIG_PATH: string;
    CLAUDE_CODE_SSE_PORT: string;
    XDG_ACTIVATION_TOKEN: string;
    XDG_SESSION_CLASS: string;
    TERM: string;
    LC_IDENTIFICATION: string;
    CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
    USER: string;
    __MISE_SESSION: string;
    MANPAGER: string;
    DISPLAY: string;
    SHLVL: string;
    GIT_EDITOR: string;
    LC_TELEPHONE: string;
    npm_config_manage_package_manager_versions: string;
    LC_MEASUREMENT: string;
    XDG_VTNR: string;
    XDG_SESSION_ID: string;
    npm_config_user_agent: string;
    OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
    DISABLE_AUTOUPDATER: string;
    PNPM_PACKAGE_NAME: string;
    XDG_RUNTIME_DIR: string;
    NODE_PATH: string;
    CLAUDE_CODE_ENTRYPOINT: string;
    DEBUGINFOD_URLS: string;
    LC_TIME: string;
    MISE_SHELL: string;
    PATH: string;
    DBUS_SESSION_BUS_ADDRESS: string;
    MAIL: string;
    LC_NUMERIC: string;
    OLDPWD: string;
    TEST: string;
    VITEST: string;
    NODE_ENV: string;
    PROD: string;
    DEV: string;
    BASE_URL: string;
    MODE: string;
    [key: `PUBLIC_${string}`]: undefined;
    [key: `${string}`]: string | undefined;
  };
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 *
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 *
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 *
 * **_Public_ access:**
 *
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 *
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 *
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 *
 * For example, given the following runtime environment:
 *
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 *
 * With the default `publicPrefix` and `privatePrefix`:
 *
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 *
 * ```
 *
 * ```
 */
declare module '$env/dynamic/public' {
  export const env: {
    [key: `PUBLIC_${string}`]: string | undefined;
  };
}
