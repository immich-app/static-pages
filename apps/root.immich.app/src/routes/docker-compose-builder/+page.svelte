<script lang="ts">
  import { afterNavigate, goto, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { siteMetadata } from '$lib';
  import PageContent from '$lib/components/PageContent.svelte';
  import { buildCompose, buildComposeFields } from '$lib/compose/build';
  import { DEFAULT_CONFIG, FOLDER_OVERRIDES, StorageType, validate, withoutAdvanced } from '$lib/compose/config';
  import { ML_ACCELS, TRANSCODE_ACCELS } from '$lib/compose/hwaccel';
  import { highlightedLines } from '$lib/compose/highlight';
  import { decodeShare, encodeShare, randomPassword } from '$lib/compose/share';
  import {
    ActionBar,
    ActionButton,
    Alert,
    AppShell,
    AppShellBar,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Checkbox,
    Code,
    CodeBlock,
    Container,
    ControlBarHeader,
    ControlBarTitle,
    Field,
    HelperText,
    IconButton,
    Input,
    Label,
    Link,
    LoadingSpinner,
    NumberInput,
    Select,
    SiteMetadata,
    Stack,
    Switch,
    Text,
    toastManager,
    type ActionItem,
    type ActionLink,
  } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiBugOutline,
    mdiClose,
    mdiContentCopy,
    mdiDiceMultiple,
    mdiDownload,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiPartyPopper,
    mdiPlus,
    mdiShareVariant,
  } from '@mdi/js';
  import { siGithub } from 'simple-icons';
  import { onMount } from 'svelte';
  import { SvelteURL } from 'svelte/reactivity';
  import { yaml as yamlLanguage } from 'svelte-highlight/languages';

  const config = $state(structuredClone(DEFAULT_CONFIG));
  const defaultDatabaseLocation =
    DEFAULT_CONFIG.database.mount.type === 'bind' ? DEFAULT_CONFIG.database.mount.location : '';

  let latestVersion = $state('');
  let versionFailed = $state(false);

  const majorVersion = $derived(latestVersion.split('.', 1)[0]);
  const version = $derived(config.version.pinned ? config.version.tag.trim() || latestVersion : majorVersion);

  const effectiveConfig = $derived.by(() => {
    const base = $state.snapshot(config);
    return base.advanced ? base : withoutAdvanced(base);
  });
  const compose = $derived(buildCompose(effectiveConfig, version));
  const errors = $derived(validate(effectiveConfig));
  const hasErrors = $derived(Object.keys(errors).length > 0);
  const fields = $derived(buildComposeFields(effectiveConfig, version));

  let focusedField = $state<string | undefined>();

  const onFocusIn = (event: FocusEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-field]');
    focusedField = target?.dataset.field;
  };

  const onFocusOut = (event: FocusEvent) => {
    const next = (event.relatedTarget as HTMLElement | null)?.closest('[data-field]');
    if (!next) {
      focusedField = undefined;
    }
  };

  const focusedLines = $derived(focusedField ? highlightedLines(compose, fields[focusedField] ?? []) : []);

  const timezones = Intl.supportedValuesOf('timeZone');

  let detectedTimezone = $state('');
  let decoded = $state(false);
  let routerReady = $state(false);

  afterNavigate(() => {
    routerReady = true;
  });

  const shareUrl = $derived.by(() => {
    const shared = structuredClone(effectiveConfig);
    if (shared.timezone === detectedTimezone) {
      shared.timezone = DEFAULT_CONFIG.timezone;
    }
    const url = new SvelteURL(page.url);
    url.search = encodeShare(shared).toString();
    return url.href;
  });

  let writtenUrl = '';

  $effect(() => {
    const target = shareUrl;
    if (decoded && routerReady && target !== writtenUrl) {
      writtenUrl = target;
      replaceState(target, {});
    }
  });

  onMount(async () => {
    Object.assign(config, decodeShare(page.url.searchParams));

    detectedTimezone = new Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (!config.timezone) {
      config.timezone = detectedTimezone;
    }
    decoded = true;

    try {
      const response = await fetch('https://version.immich.cloud/version');
      const { version: fetched } = response.ok ? await response.json() : {};
      if (!fetched) {
        versionFailed = true;
        return;
      }

      latestVersion = fetched;
    } catch {
      versionFailed = true;
    }
  });

  const generatePassword = () => {
    config.database.password = randomPassword();
  };

  const addLibrary = () => {
    config.storage.externalLibraries.push({ path: '', readOnly: true });
  };

  const removeLibrary = (index: number) => {
    config.storage.externalLibraries.splice(index, 1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compose);
      toastManager.primary('Copied to clipboard');
    } catch (error) {
      toastManager.danger('Failed to copy docker-compose.yml to clipboard');
      console.error(error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([compose], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'docker-compose.yml';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toastManager.primary('Link copied to clipboard');
    } catch (error) {
      toastManager.danger('Failed to copy the link to clipboard');
      console.error(error);
    }
  };

  const FEEDBACK_URL = 'https://github.com/immich-app/immich/discussions/31232';
  const SOURCE_URL = 'https://github.com/immich-app/static-pages/tree/main/apps/root.immich.app/src/lib/compose';
  const ISSUE_URL = 'https://github.com/immich-app/static-pages/issues/new';

  const Source: ActionLink = {
    title: 'View source',
    icon: siGithub,
    href: SOURCE_URL,
  };

  const ReportIssue: ActionLink = {
    title: 'Report a problem',
    icon: mdiBugOutline,
    href: ISSUE_URL,
  };

  const pageMetadata = {
    title: 'Docker Compose Builder',
    description: 'Build a custom docker-compose.yml file for Immich.',
  };

  const Share: ActionItem = $derived({
    title: 'Copy shareable link',
    icon: mdiShareVariant,
    onAction: () => handleShare(),
    $if: () => !!globalThis.navigator?.clipboard,
  });

  const Copy: ActionItem = $derived({
    title: 'Copy',
    icon: mdiContentCopy,
    onAction: () => handleCopy(),
    $if: () => !!globalThis.navigator?.clipboard,
  });

  const Download: ActionItem = {
    title: 'Download',
    icon: mdiDownload,
    onAction: () => handleDownload(),
  };

  const Advanced: ActionItem = $derived({
    title: config.advanced ? 'Hide advanced options' : 'Show advanced options',
    icon: config.advanced ? mdiEyeOutline : mdiEyeOffOutline,
    shape: 'round',
    color: 'secondary',
    variant: 'ghost',
    onAction: () => (config.advanced = !config.advanced),
  });

  toastManager.setOptions({ class: 'top-[66px]' });
</script>

<svelte:head>
  <title>Immich - Docker Compose</title>
</svelte:head>

{#snippet fieldError(message: string | undefined)}
  {#if message}
    <HelperText color="danger">{message}</HelperText>
  {/if}
{/snippet}

<SiteMetadata site={siteMetadata} page={pageMetadata} />

<div class="flex h-dvh flex-col">
  <AppShell class="h-auto min-h-0 grow">
    <AppShellBar>
      <ActionBar
        overflowActions={[Source, ReportIssue]}
        closeIcon={mdiArrowLeft}
        translations={{ close: 'Back' }}
        closeOnEsc={false}
        onClose={() => goto('/download')}
        static
        shape="round"
        variant="filled"
      >
        <ControlBarHeader>
          <ControlBarTitle>{pageMetadata.title}</ControlBarTitle>
        </ControlBarHeader>
      </ActionBar>
    </AppShellBar>
    <PageContent>
      <Container size="giant" center>
        <Alert color="primary" icon={mdiPartyPopper} title="New feature" shape="rectangle" class="my-3">
          <div>
            This tool is new. Please give us <Link href={FEEDBACK_URL}>your feedback</Link>!
          </div>
        </Alert>

        <div class="my-4 flex justify-end gap-2">
          <ActionButton action={Advanced} />
          <ActionButton action={Share} />
          <ActionButton action={Copy} />
          <ActionButton action={Download} type="button" variant="filled" size="medium" shape="round" color="primary" />
        </div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[clamp(20rem,34%,31.25rem)_1fr]">
          <form
            autocomplete="off"
            onsubmit={(event) => event.preventDefault()}
            onfocusin={onFocusIn}
            onfocusout={onFocusOut}
          >
            <Stack gap={6}>
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>General</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap={4}>
                    <Field>
                      <Stack gap={2}>
                        <Label label="Immich Version Tag" size="small" />
                        <div class="grid grid-cols-2 gap-1 rounded-2xl border p-1">
                          <Button
                            size="small"
                            fullWidth
                            variant={config.version.pinned ? 'ghost' : 'filled'}
                            color={config.version.pinned ? 'secondary' : 'primary'}
                            data-field="version"
                            onclick={() => (config.version.pinned = false)}
                          >
                            Rolling
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant={config.version.pinned ? 'filled' : 'ghost'}
                            color={config.version.pinned ? 'primary' : 'secondary'}
                            data-field="version"
                            onclick={() => (config.version.pinned = true)}
                          >
                            Pinned
                          </Button>
                        </div>
                        {#if config.version.pinned}
                          <Input
                            bind:value={config.version.tag}
                            data-field="version"
                            placeholder={latestVersion}
                            aria-label="Pinned Immich version tag"
                          />
                        {/if}
                        {#if !version}
                          <Text size="small" color="muted">
                            {versionFailed ? 'Version unavailable.' : 'Checking for the latest release...'}
                          </Text>
                        {:else if config.version.pinned}
                          <Text size="small" color="muted">
                            Locked to <Code>{version}</Code>, updated manually.
                          </Text>
                        {:else}
                          <Text size="small" color="muted">
                            The newest <Code>{majorVersion}</Code> release each time you pull.
                          </Text>
                        {/if}
                      </Stack>
                    </Field>

                    <Field label="Rootless mode">
                      <Switch
                        bind:checked={config.rootless.enabled}
                        data-field="rootless"
                        class="flex justify-between gap-4"
                      />
                    </Field>
                    {#if config.rootless.enabled}
                      <div class="grid grid-cols-2 gap-4">
                        <Field label="UID" invalid={!!errors['rootless.uid']}>
                          <NumberInput
                            bind:value={config.rootless.uid}
                            data-field="rootlessUser"
                            min={0}
                            placeholder={String(DEFAULT_CONFIG.rootless.uid)}
                          />
                          {@render fieldError(errors['rootless.uid'])}
                        </Field>
                        <Field label="GID" invalid={!!errors['rootless.gid']}>
                          <NumberInput
                            bind:value={config.rootless.gid}
                            data-field="rootlessUser"
                            min={0}
                            placeholder={String(DEFAULT_CONFIG.rootless.gid)}
                          />
                          {@render fieldError(errors['rootless.gid'])}
                        </Field>
                      </div>
                    {/if}

                    {#if config.advanced}
                      <Field
                        label="Container names"
                        description="Turn off to run more than one Immich stack on the same host."
                      >
                        <Switch
                          bind:checked={config.containerNames}
                          data-field="containerNames"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                    {/if}
                  </Stack>
                </CardBody>
              </Card>

              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Server</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap={4}>
                    <Field label="Server Timezone">
                      <Input
                        bind:value={config.timezone}
                        data-field="timezone"
                        list="timezones"
                        placeholder="Etc/UTC"
                      />
                      <!-- TODO: Combobox in @immich/ui -->
                      <datalist id="timezones">
                        {#each timezones as timezone (timezone)}
                          <option value={timezone}></option>
                        {/each}
                      </datalist>
                    </Field>

                    <Field label="Upload Location" invalid={!!errors['storage.uploadLocation']}>
                      <Input
                        bind:value={config.storage.uploadLocation}
                        data-field="uploadLocation"
                        placeholder={DEFAULT_CONFIG.storage.uploadLocation}
                      />
                      {@render fieldError(errors['storage.uploadLocation'])}
                    </Field>

                    {#if config.advanced}
                      <Field
                        label="Custom folder locations"
                        description="Mount individual subfolders on separate storage."
                      >
                        <Switch
                          bind:checked={config.storage.customFolders}
                          data-field="customFolders"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                      {#if config.storage.customFolders}
                        <Text size="small" color="muted">Leave a field blank to keep it under the upload location.</Text
                        >
                        {#each FOLDER_OVERRIDES as folder (folder.key)}
                          {@const error = errors[`storage.overrides.${folder.key}`]}
                          <Field label={folder.label} invalid={!!error}>
                            <Input
                              bind:value={config.storage.overrides[folder.key]}
                              data-field={`override:${folder.key}`}
                              placeholder="Optional host path"
                            />
                            {@render fieldError(error)}
                          </Field>
                        {/each}
                      {/if}

                      <Stack gap={2}>
                        <Label label="External libraries" size="small" />
                        <Text size="small" color="muted"
                          >Existing media, mounted at the same path inside the container.</Text
                        >
                        {#each config.storage.externalLibraries as library, index (index)}
                          {@const error = errors[`storage.externalLibraries.${index}.path`]}
                          {@const name = library.path.trim() || `row ${index + 1}`}
                          <Field invalid={!!error}>
                            <div class="flex items-center gap-2">
                              <div class="grow">
                                <Input
                                  bind:value={library.path}
                                  data-field={`library:${index}`}
                                  placeholder="/mnt/media/photos"
                                  aria-label={`External library path ${index + 1}`}
                                />
                              </div>
                              <Field class="w-auto">
                                <Checkbox bind:checked={library.readOnly} aria-label={`Read-only for ${name}`} />
                              </Field>
                              <Text size="small" color="muted">Read-only</Text>
                              <IconButton
                                icon={mdiClose}
                                onclick={() => removeLibrary(index)}
                                aria-label={`Remove ${name}`}
                                variant="ghost"
                                color="secondary"
                              />
                            </div>
                            {@render fieldError(error)}
                          </Field>
                        {/each}
                        {#if config.storage.externalLibraries.some(({ readOnly }) => !readOnly)}
                          <Text size="small" color="muted">
                            Where read-only is off, Immich can delete files and write XMP sidecars.
                          </Text>
                        {/if}
                        <Button
                          size="small"
                          variant="outline"
                          color="secondary"
                          leadingIcon={mdiPlus}
                          class="self-start"
                          onclick={addLibrary}
                        >
                          Add library
                        </Button>
                      </Stack>

                      <Field label="Host Port" invalid={!!errors.port}>
                        <NumberInput
                          bind:value={config.port}
                          data-field="port"
                          min={1}
                          max={65_535}
                          placeholder={String(DEFAULT_CONFIG.port)}
                        />
                        {@render fieldError(errors.port)}
                      </Field>

                      <Field label="External network" description="Attach the server to a network you already created.">
                        <Switch
                          bind:checked={config.network.external}
                          data-field="networkExternal"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                      {#if config.network.external}
                        <Field label="Network name" invalid={!!errors['network.name']}>
                          <Input bind:value={config.network.name} data-field="networkName" placeholder="proxy" />
                          {@render fieldError(errors['network.name'])}
                        </Field>
                      {/if}
                    {/if}

                    <Field label="Transcoding Hardware Acceleration">
                      <div data-field="transcoding">
                        <Select bind:value={config.hwaccel.transcoding} options={TRANSCODE_ACCELS} />
                      </div>
                    </Field>
                  </Stack>
                </CardBody>
              </Card>

              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Machine Learning</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap={4}>
                    {#if config.advanced}
                      <Field label="Remote machine learning">
                        <Switch
                          bind:checked={config.machineLearning.external}
                          data-field="mlExternal"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                    {/if}
                    {#if config.advanced && config.machineLearning.external}
                      <Text size="small" color="muted">
                        Point your server at the remote instance in the admin settings. See the
                        <Link href="https://docs.immich.app/guides/remote-machine-learning"
                          >remote machine learning guide</Link
                        >.
                      </Text>
                    {/if}
                    {#if !config.machineLearning.external}
                      <Field label="Hardware Acceleration">
                        <div data-field="ml">
                          <Select bind:value={config.hwaccel.ml} options={ML_ACCELS} />
                        </div>
                      </Field>
                    {/if}
                  </Stack>
                </CardBody>
              </Card>

              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Database</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap={4}>
                    {#if config.advanced}
                      <Field label="External Postgres">
                        <Switch
                          bind:checked={config.database.external}
                          data-field="databaseExternal"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                    {/if}
                    {#if config.advanced && config.database.external}
                      <Text size="small" color="muted">
                        The VectorChord extension must be installed. See the
                        <Link href="https://docs.immich.app/administration/postgres-standalone"
                          >standalone Postgres guide</Link
                        >.
                      </Text>
                      <Field label="Connection URL" invalid={!!errors['database.externalUrl']}>
                        <Input
                          bind:value={config.database.externalUrl}
                          data-field="externalUrl"
                          placeholder="postgresql://user:password@host:5432/immich"
                        />
                        {@render fieldError(errors['database.externalUrl'])}
                      </Field>
                    {:else}
                      <Field
                        label="Use a named volume"
                        description="Docker manages the storage location. Recommended on Windows and macOS."
                      >
                        <Switch
                          data-field="databaseMount"
                          checked={config.database.mount.type === 'volume'}
                          onCheckedChange={(value) =>
                            (config.database.mount = value
                              ? { type: 'volume' }
                              : structuredClone(DEFAULT_CONFIG.database.mount))}
                          class="flex justify-between gap-4"
                        />
                      </Field>
                      {#if config.database.mount.type === 'bind'}
                        <Field label="Database Location" invalid={!!errors['database.mount.location']}>
                          <Input
                            bind:value={config.database.mount.location}
                            data-field="databaseLocation"
                            placeholder={defaultDatabaseLocation}
                          />
                          {@render fieldError(errors['database.mount.location'])}
                        </Field>
                      {/if}
                      <Field label="Database storage type">
                        <div data-field="databaseStorageType">
                          <Select bind:value={config.database.storageType} options={Object.values(StorageType)} />
                        </div>
                      </Field>
                      <Field label="Database Password" invalid={!!errors['database.password']}>
                        <div class="flex items-end gap-2">
                          <div class="grow">
                            <Input bind:value={config.database.password} data-field="databasePassword" />
                          </div>
                          <IconButton
                            data-field="databasePassword"
                            icon={mdiDiceMultiple}
                            onclick={generatePassword}
                            aria-label="Generate a random password"
                            variant="ghost"
                            color="secondary"
                          />
                        </div>
                        {@render fieldError(errors['database.password'])}
                      </Field>
                    {/if}
                  </Stack>
                </CardBody>
              </Card>

              {#if config.advanced}
                <Card color="secondary">
                  <CardHeader>
                    <CardTitle>Redis</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Stack gap={4}>
                      <Field label="External Redis">
                        <Switch
                          bind:checked={config.redis.external}
                          data-field="redisExternal"
                          class="flex justify-between gap-4"
                        />
                      </Field>
                      {#if config.redis.external}
                        <Field label="Host" invalid={!!errors['redis.host']}>
                          <Input
                            bind:value={config.redis.host}
                            data-field="redisHost"
                            placeholder="redis.example.com"
                          />
                          {@render fieldError(errors['redis.host'])}
                        </Field>
                        <Field label="Port" invalid={!!errors['redis.port']}>
                          <NumberInput
                            bind:value={config.redis.port}
                            data-field="redisPort"
                            min={1}
                            max={65_535}
                            placeholder="6379"
                          />
                          {@render fieldError(errors['redis.port'])}
                        </Field>
                        <Field label="Password">
                          <Input bind:value={config.redis.password} data-field="redisPassword" placeholder="Optional" />
                        </Field>
                      {/if}
                    </Stack>
                  </CardBody>
                </Card>
              {/if}
            </Stack>
          </form>

          <div class="min-w-0 self-start lg:sticky lg:top-6">
            {#if versionFailed}
              <Text color="danger">Could not reach the Immich version service. Reload the page to try again.</Text>
            {:else if version}
              <CodeBlock
                code={compose}
                language={yamlLanguage}
                lineNumbers
                highlightedLines={focusedLines}
                copy={!hasErrors}
              />
            {:else}
              <LoadingSpinner />
            {/if}
          </div>
        </div>
      </Container>
    </PageContent>
  </AppShell>
</div>
