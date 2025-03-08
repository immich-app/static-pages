<script lang="ts">
  import CodePreview from '$lib/components/CodePreview.svelte';
  import DefaultPageLayout from '$lib/layouts/DefaultPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Field,
    Heading,
    Input,
    PasswordInput,
    Stack,
    Switch,
    Text,
  } from '@immich/ui';
  import { mdiDownload, mdiShareVariantOutline } from '@mdi/js';

  type Settings = {
    customFolders: boolean;
    externalRedis: boolean;
    externalPostgres: boolean;
    composeContainerNames: boolean;
    composeHealthchecks: boolean;
  };

  type Values = {
    releaseVersion: string;
    baseLocation: string;
    serverTimeZone: string;

    libraryLocation: string;
    uploadLocation: string;
    backupsLocation: string;
    profileLocation: string;
    thumbnailsLocation: string;
    encodedVideoLocation: string;

    externalPostgresUri: string;
    postgresUser: string;
    postgresPassword: string;
    postgresDatabase: string;
    postgresDataLocation: string;

    externalRedisUri: string;
  };

  const settings = $state<Settings>({
    customFolders: false,
    externalRedis: false,
    externalPostgres: false,
    composeContainerNames: true,
    composeHealthchecks: true,
  });

  const values = $state<Values>({
    releaseVersion: 'v1.122.0',
    baseLocation: '/home/immich/data/library',
    serverTimeZone: 'America/New_York',

    libraryLocation: '/home/immich/data/library',
    uploadLocation: '/home/immich/data/library',
    backupsLocation: '/home/immich/data/library',
    profileLocation: '/home/immich/data/library',
    thumbnailsLocation: '/home/immich/data/library',
    encodedVideoLocation: '/home/immich/data/encoded-video',

    externalPostgresUri: '',
    postgresUser: 'postgres',
    postgresPassword: 'postgres',
    postgresDatabase: 'immich',
    postgresDataLocation: '/home/immich/data/postgres',

    externalRedisUri: '',
  });

  const makeSpec = (settings: Settings, values: Values) => {
    return JSON.stringify({ settings, values }, null, 4);
  };

  const spec = $derived(makeSpec(settings, values));

  const handleShare = () => {
    //
  };

  const handleDownload = () => {
    //
  };
</script>

<DefaultPageLayout>
  <div class="h-full mx-auto max-w-screen-lg p-4">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
      <div>
        <Heading size="large" tag="h1">Docker Compose</Heading>
        <Text>Generate a docker-compose.yaml file for Immich</Text>
      </div>
      <div class="flex gap-2 items-center">
        <Button leadingIcon={mdiShareVariantOutline} shape="round" onclick={() => handleShare()}>Share</Button>
        <Button leadingIcon={mdiDownload} shape="round" onclick={() => handleDownload()}>Download</Button>
      </div>
    </div>

    <CodePreview code={spec}>
      <div class="flex flex-col lg:flex-row-reverse gap-2">
        <div>
          <Card color="secondary">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <Stack>
                <Field label="Custom Folders">
                  <Switch bind:checked={settings.customFolders} class="flex justify-between gap-4" />
                </Field>
                <Field label="External Postgres">
                  <Switch bind:checked={settings.externalPostgres} class="flex justify-between gap-4" />
                </Field>
                <Field label="External Redis">
                  <Switch bind:checked={settings.externalRedis} class="flex justify-between gap-4" />
                </Field>
                <Field label="Healthchecks">
                  <Switch bind:checked={settings.composeHealthchecks} class="flex justify-between gap-4" />
                </Field>
                <Field label="Container Names">
                  <Switch bind:checked={settings.composeContainerNames} class="flex justify-between gap-4" />
                </Field>
                <!-- <Field label="Immich Version">
                <Input value={form.releaseVersion} placeholder="v1.122.0" class="max-w-xs" />
              </Field> -->
              </Stack>
            </CardBody>
          </Card>
        </div>

        <form class="grow">
          <Stack>
            <Card color="secondary">
              <CardHeader>
                <CardTitle>Options</CardTitle>
              </CardHeader>
              <CardBody>
                <Stack>
                  <Field label="Server Timezone">
                    <Input value={values.serverTimeZone} placeholder="American/New_York" />
                  </Field>
                </Stack>
              </CardBody>
            </Card>

            {#if settings.customFolders}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Custom Folders</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack>
                    <Field label="Library Location">
                      <Input value={values.libraryLocation} placeholder="v1.122.0" />
                    </Field>
                    <Field label="Upload Location">
                      <Input value={values.uploadLocation} placeholder="v1.122.0" />
                    </Field>
                    <Field label="Profile Location">
                      <Input value={values.profileLocation} placeholder="v1.122.0" />
                    </Field>
                    <Field label="Thumbnail Location">
                      <Input value={values.thumbnailsLocation} placeholder="v1.122.0" />
                    </Field>
                    <Field label="Encoded Video Location">
                      <Input value={values.encodedVideoLocation} placeholder="v1.122.0" />
                    </Field>
                    <Field label="Backups Location">
                      <Input value={values.backupsLocation} placeholder="v1.122.0" />
                    </Field>
                  </Stack>
                </CardBody>
              </Card>
            {:else}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Folders</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack>
                    <Field label="Base Location">
                      <Input value={values.baseLocation} placeholder="v1.122.0" />
                    </Field>
                  </Stack>
                </CardBody>
              </Card>
            {/if}

            {#if settings.externalPostgres}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>External Postgres</CardTitle>
                </CardHeader>
                <CardBody>
                  <Field label="External URI">
                    <Input value={values.externalPostgresUri} placeholder="postgres://..." />
                  </Field>
                </CardBody>
              </Card>
            {:else}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>Postgres</CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack>
                    <div class="grid grid-col-1 lg:grid-cols-2 gap-2">
                      {#if settings.externalPostgres}
                        <Field label="External URI">
                          <Input value={values.postgresUser} placeholder="immich" />
                        </Field>
                      {:else}
                        <Field label="User">
                          <Input value={values.postgresUser} placeholder="immich" />
                        </Field>
                        <Field label="Password">
                          <PasswordInput value={values.postgresPassword} placeholder="immich" />
                        </Field>
                        <Field label="Database Name">
                          <Input value={values.postgresUser} placeholder="immich" />
                        </Field>
                        <Field label="Data Location">
                          <Input value={values.postgresUser} placeholder="immich" />
                        </Field>
                      {/if}
                    </div>
                  </Stack>
                </CardBody>
              </Card>
            {/if}

            {#if settings.externalRedis}
              <Card color="secondary">
                <CardHeader>
                  <CardTitle>External Redis</CardTitle>
                </CardHeader>
                <CardBody>
                  <Field label="Redis URI">
                    <Input value={values.postgresDataLocation} placeholder="immich" />
                  </Field>
                </CardBody>
              </Card>
            {/if}
          </Stack>
        </form>
      </div>
    </CodePreview>
  </div>
</DefaultPageLayout>
