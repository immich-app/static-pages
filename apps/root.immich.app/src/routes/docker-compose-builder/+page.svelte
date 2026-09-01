<script lang="ts">
  import { goto } from '$app/navigation';
  import { siteMetadata } from '$lib';
  import PageContent from '$lib/components/PageContent.svelte';
  import { buildCompose } from '$lib/compose/build';
  import { DEFAULT_CONFIG, FOLDER_OVERRIDES, StorageType, validate, withoutAdvanced } from '$lib/compose/config';
  import { ML_ACCELS, TRANSCODE_ACCELS } from '$lib/compose/hwaccel';
  import {
    ActionBar,
    ActionButton,
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
  } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiClose,
    mdiContentCopy,
    mdiDiceMultiple,
    mdiDownload,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiPlus,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import { yaml as yamlLanguage } from 'svelte-highlight/languages';

  const config = $state(structuredClone(DEFAULT_CONFIG));
  const defaultDatabaseLocation =
    DEFAULT_CONFIG.database.mount.type === 'bind' ? DEFAULT_CONFIG.database.mount.location : '';

  let advanced = $state(false);
  let versionPinned = $state(false);
  let pinnedVersion = $state('');
  let latestVersion = $state('');
  let versionFailed = $state(false);

  const majorVersion = $derived(latestVersion.split('.', 1)[0]);
  const version = $derived(versionPinned ? pinnedVersion.trim() || latestVersion : majorVersion);

  const effectiveConfig = $derived.by(() => {
    const base = $state.snapshot(config);
    return advanced ? base : withoutAdvanced(base);
  });
  const compose = $derived(buildCompose(effectiveConfig, version));
  const errors = $derived(validate(effectiveConfig));
  const hasErrors = $derived(Object.keys(errors).length > 0);

  const timezones = Intl.supportedValuesOf('timeZone');

  onMount(async () => {
    if (!config.timezone) {
      config.timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    }

    try {
      const response = await fetch('https://version.immich.cloud/version');
      const { version: fetched } = response.ok ? await response.json() : {};
      if (!fetched) {
        versionFailed = true;
        return;
      }

      if (!pinnedVersion) {
        pinnedVersion = fetched;
      }
      latestVersion = fetched;
    } catch {
      versionFailed = true;
    }
  });

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    config.database.password = Array.from(
      crypto.getRandomValues(new Uint8Array(24)),
      (byte) => alphabet[byte % alphabet.length],
    ).join('');
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

  const pageMetadata = {
    title: 'Docker Compose Builder',
    description: 'Build a custom docker-compose.yml file for Immich.',
  };

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
    title: advanced ? 'Hide advanced options' : 'Show advanced options',
    icon: advanced ? mdiEyeOutline : mdiEyeOffOutline,
    shape: 'round',
    color: 'secondary',
    variant: 'ghost',
    onAction: () => (advanced = !advanced),
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

<AppShell>
  <AppShellBar>
    <ActionBar
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
      <div class="my-4 flex justify-end gap-2">
        <ActionButton action={Advanced} />
        <ActionButton action={Copy} />
        <ActionButton action={Download} type="button" variant="filled" size="medium" shape="round" color="primary" />
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[clamp(20rem,34%,31.25rem)_1fr]">
        <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
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
                          variant={versionPinned ? 'ghost' : 'filled'}
                          color={versionPinned ? 'secondary' : 'primary'}
                          onclick={() => (versionPinned = false)}
                        >
                          Rolling
                        </Button>
                        <Button
                          size="small"
                          fullWidth
                          variant={versionPinned ? 'filled' : 'ghost'}
                          color={versionPinned ? 'primary' : 'secondary'}
                          onclick={() => (versionPinned = true)}
                        >
                          Pinned
                        </Button>
                      </div>
                      {#if versionPinned}
                        <Input
                          bind:value={pinnedVersion}
                          placeholder={latestVersion}
                          aria-label="Pinned Immich version tag"
                        />
                      {/if}
                      {#if !version}
                        <Text size="small" color="muted">
                          {versionFailed ? 'Version unavailable.' : 'Checking for the latest release...'}
                        </Text>
                      {:else if versionPinned}
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
                    <Switch bind:checked={config.rootless.enabled} class="flex justify-between gap-4" />
                  </Field>
                  {#if config.rootless.enabled}
                    <div class="grid grid-cols-2 gap-4">
                      <Field label="UID" invalid={!!errors['rootless.uid']}>
                        <NumberInput
                          bind:value={config.rootless.uid}
                          min={0}
                          placeholder={String(DEFAULT_CONFIG.rootless.uid)}
                        />
                        {@render fieldError(errors['rootless.uid'])}
                      </Field>
                      <Field label="GID" invalid={!!errors['rootless.gid']}>
                        <NumberInput
                          bind:value={config.rootless.gid}
                          min={0}
                          placeholder={String(DEFAULT_CONFIG.rootless.gid)}
                        />
                        {@render fieldError(errors['rootless.gid'])}
                      </Field>
                    </div>
                  {/if}

                  {#if advanced}
                    <Field
                      label="Container names"
                      description="Turn off to run more than one Immich stack on the same host."
                    >
                      <Switch bind:checked={config.containerNames} class="flex justify-between gap-4" />
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
                    <Input bind:value={config.timezone} list="timezones" placeholder="Etc/UTC" />
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
                      placeholder={DEFAULT_CONFIG.storage.uploadLocation}
                    />
                    {@render fieldError(errors['storage.uploadLocation'])}
                  </Field>

                  {#if advanced}
                    <Field
                      label="Custom folder locations"
                      description="Mount individual subfolders on separate storage."
                    >
                      <Switch bind:checked={config.storage.customFolders} class="flex justify-between gap-4" />
                    </Field>
                    {#if config.storage.customFolders}
                      <Text size="small" color="muted">Leave a field blank to keep it under the upload location.</Text>
                      {#each FOLDER_OVERRIDES as folder (folder.key)}
                        {@const error = errors[`storage.overrides.${folder.key}`]}
                        <Field label={folder.label} invalid={!!error}>
                          <Input bind:value={config.storage.overrides[folder.key]} placeholder="Optional host path" />
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
                        min={1}
                        max={65_535}
                        placeholder={String(DEFAULT_CONFIG.port)}
                      />
                      {@render fieldError(errors.port)}
                    </Field>

                    <Field label="External network" description="Attach the server to a network you already created.">
                      <Switch bind:checked={config.network.external} class="flex justify-between gap-4" />
                    </Field>
                    {#if config.network.external}
                      <Field label="Network name" invalid={!!errors['network.name']}>
                        <Input bind:value={config.network.name} placeholder="proxy" />
                        {@render fieldError(errors['network.name'])}
                      </Field>
                    {/if}
                  {/if}

                  <Field label="Transcoding Hardware Acceleration">
                    <Select bind:value={config.hwaccel.transcoding} options={TRANSCODE_ACCELS} />
                  </Field>
                </Stack>
              </CardBody>
            </Card>

            <Card color="secondary">
              <CardHeader>
                <CardTitle>Machine Learning</CardTitle>
              </CardHeader>
              <CardBody>
                <Field label="Hardware Acceleration">
                  <Select bind:value={config.hwaccel.ml} options={ML_ACCELS} />
                </Field>
              </CardBody>
            </Card>

            <Card color="secondary">
              <CardHeader>
                <CardTitle>Database</CardTitle>
              </CardHeader>
              <CardBody>
                <Stack gap={4}>
                  {#if advanced}
                    <Field label="External Postgres">
                      <Switch bind:checked={config.database.external} class="flex justify-between gap-4" />
                    </Field>
                  {/if}
                  {#if advanced && config.database.external}
                    <Text size="small" color="muted">
                      The VectorChord extension must be installed. See the
                      <Link href="https://docs.immich.app/administration/postgres-standalone"
                        >standalone Postgres guide</Link
                      >.
                    </Text>
                    <Field label="Connection URL" invalid={!!errors['database.externalUrl']}>
                      <Input
                        bind:value={config.database.externalUrl}
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
                        <Input bind:value={config.database.mount.location} placeholder={defaultDatabaseLocation} />
                        {@render fieldError(errors['database.mount.location'])}
                      </Field>
                    {/if}
                    <Field label="Database storage type">
                      <Select bind:value={config.database.storageType} options={Object.values(StorageType)} />
                    </Field>
                    <Field label="Database Password" invalid={!!errors['database.password']}>
                      <div class="flex items-end gap-2">
                        <div class="grow">
                          <Input bind:value={config.database.password} />
                        </div>
                        <IconButton
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

            {#if advanced}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Redis</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap={4}>
                    <Field label="External Redis">
                      <Switch bind:checked={config.redis.external} class="flex justify-between gap-4" />
                    </Field>
                    {#if config.redis.external}
                      <Field label="Host" invalid={!!errors['redis.host']}>
                        <Input bind:value={config.redis.host} placeholder="redis.example.com" />
                        {@render fieldError(errors['redis.host'])}
                      </Field>
                      <Field label="Port" invalid={!!errors['redis.port']}>
                        <NumberInput bind:value={config.redis.port} min={1} max={65_535} placeholder="6379" />
                        {@render fieldError(errors['redis.port'])}
                      </Field>
                      <Field label="Password">
                        <Input bind:value={config.redis.password} placeholder="Optional" />
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
            <CodeBlock code={compose} language={yamlLanguage} lineNumbers copy={!hasErrors} />
          {:else}
            <LoadingSpinner />
          {/if}
        </div>
      </div>
    </Container>
  </PageContent>
</AppShell>
