<script lang="ts">
  import FullPageLayout from '$common/components/FullPageLayout.svelte';
  import { buildCompose } from '$lib/compose/build';
  import { ML_ACCELS, TRANSCODE_ACCELS } from '$lib/compose/hwaccel';
  import { DEFAULT_CONFIG, FOLDER_OVERRIDES, StorageType, withoutAdvanced } from '$lib/compose/types';
  import { validate } from '$lib/compose/validate';
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Code,
    CodeBlock,
    Field,
    Heading,
    Icon,
    IconButton,
    Input,
    Label,
    Link,
    Select,
    Stack,
    Switch,
    Text,
  } from '@immich/ui';
  import { mdiDiceMultiple, mdiDownload } from '@mdi/js';
  import { onMount } from 'svelte';
  import { yaml as yamlLanguage } from 'svelte-highlight/languages';
  import vs2015 from 'svelte-highlight/styles/vs2015';

  const config = $state(structuredClone(DEFAULT_CONFIG));
  const defaultDatabaseLocation =
    DEFAULT_CONFIG.database.mount.type === 'bind' ? DEFAULT_CONFIG.database.mount.location : '';

  let advanced = $state(false);
  let versionPinned = $state(false);
  let pinnedVersion = $state(DEFAULT_CONFIG.version);
  let pinnedEdited = $state(false);
  let latestVersion = $state(DEFAULT_CONFIG.version);

  const majorVersion = $derived(latestVersion.split('.')[0]);
  const version = $derived(versionPinned ? pinnedVersion.trim() || latestVersion : majorVersion);

  const effectiveConfig = $derived.by(() => {
    const base = { ...$state.snapshot(config), version };
    return advanced ? base : withoutAdvanced(base);
  });
  const compose = $derived(buildCompose(effectiveConfig));
  const errors = $derived(validate(effectiveConfig));
  const hasErrors = $derived(Object.keys(errors).length > 0);

  const timezones = (() => {
    const intl = Intl as { supportedValuesOf?: (key: string) => string[] };
    return intl.supportedValuesOf ? intl.supportedValuesOf('timeZone') : [];
  })();

  onMount(async () => {
    if (!config.timezone) {
      config.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    }

    try {
      const response = await fetch('https://version.immich.cloud/version');
      if (response.ok) {
        const data = await response.json();
        if (data.version) {
          latestVersion = data.version;
          if (!pinnedEdited) {
            pinnedVersion = data.version;
          }
        }
      }
    } catch {
      // Fall back to the default version tag.
    }
  });

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const limit = 256 - (256 % alphabet.length);
    let password = '';
    while (password.length < 24) {
      for (const byte of crypto.getRandomValues(new Uint8Array(24))) {
        if (byte < limit && password.length < 24) {
          password += alphabet[byte % alphabet.length];
        }
      }
    }
    config.database.password = password;
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
</script>

<svelte:head>
  <title>Immich - Docker Compose</title>
</svelte:head>

{#snippet fieldError(message: string | undefined)}
  {#if message}
    <Text size="small" color="danger">{message}</Text>
  {/if}
{/snippet}

<FullPageLayout size="giant">
  <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <Heading size="large" tag="h1">Docker Compose</Heading>
      <Text color="muted">Generate a docker-compose.yml file for Immich</Text>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <Text size="small" color="muted">Advanced</Text>
        <Switch bind:checked={advanced} aria-label="Show advanced options" />
      </div>
      <Button shape="round" onclick={handleDownload} disabled={hasErrors}>
        <Icon icon={mdiDownload} size="1.5rem" />
        <span>Download</span>
      </Button>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 2xl:grid-cols-2">
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
                      oninput={() => (pinnedEdited = true)}
                      placeholder={latestVersion}
                      aria-label="Pinned Immich version tag"
                    />
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
                <Switch bind:checked={config.rootless} class="flex justify-between gap-4" />
              </Field>
              {#if config.rootless}
                <Text size="small" color="muted">
                  Runs services as UID 1000. The mounted folders must be owned by that user.
                </Text>
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

              {#if advanced}
                <Field label="Host Port" invalid={!!errors.port}>
                  <Input bind:value={config.port} placeholder={DEFAULT_CONFIG.port} />
                  {@render fieldError(errors.port)}
                </Field>
              {/if}

              <Field label="Upload Location" invalid={!!errors.uploadLocation}>
                <Input bind:value={config.storage.uploadLocation} placeholder={DEFAULT_CONFIG.storage.uploadLocation} />
                {@render fieldError(errors.uploadLocation)}
              </Field>

              {#if advanced}
                <Field label="Custom folder locations">
                  <Switch bind:checked={config.storage.customFolders} class="flex justify-between gap-4" />
                </Field>
                {#if config.storage.customFolders}
                  <Text size="small" color="muted">
                    Mount individual subfolders on separate storage. Leave a field blank to keep it under the upload
                    location.
                  </Text>
                  {#each FOLDER_OVERRIDES as folder (folder.key)}
                    <Field label={folder.label} invalid={!!errors[folder.key]}>
                      <Input bind:value={config.storage.overrides[folder.key]} placeholder="Optional host path" />
                      {@render fieldError(errors[folder.key])}
                    </Field>
                  {/each}
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
                <Field label="Connection URL" invalid={!!errors.externalUrl}>
                  <Input
                    bind:value={config.database.externalUrl}
                    placeholder="postgresql://user:password@host:5432/immich"
                  />
                  {@render fieldError(errors.externalUrl)}
                </Field>
              {:else}
                <Field label="Use a named volume">
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
                  <Field label="Database Location" invalid={!!errors.databaseLocation}>
                    <Input bind:value={config.database.mount.location} placeholder={defaultDatabaseLocation} />
                    {@render fieldError(errors.databaseLocation)}
                  </Field>
                {:else}
                  <Text size="small" color="muted">
                    Docker manages the storage location. Recommended on Windows and macOS.
                  </Text>
                {/if}
                <Field label="Database storage type">
                  <Select bind:value={config.database.storageType} options={Object.values(StorageType)} />
                </Field>
                <Field label="Database Password" invalid={!!errors.databasePassword}>
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
                  {@render fieldError(errors.databasePassword)}
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
                  <Field label="Host" invalid={!!errors.redisHost}>
                    <Input bind:value={config.redis.host} placeholder="redis.example.com" />
                    {@render fieldError(errors.redisHost)}
                  </Field>
                  <Field label="Port" invalid={!!errors.redisPort}>
                    <Input bind:value={config.redis.port} placeholder="6379" />
                    {@render fieldError(errors.redisPort)}
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

    <div class="self-start 2xl:sticky 2xl:top-6">
      <!-- TODO: The copy button the UI lib puts on is broken -->
      <!-- Also we should disable the copy button when validation is failing -->
      <CodeBlock code={compose} language={yamlLanguage} lineNumbers lightTheme={vs2015} darkTheme={vs2015} />
    </div>
  </div>
</FullPageLayout>
