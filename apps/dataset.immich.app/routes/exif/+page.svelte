<script lang="ts">
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import FullPageLayout from '$lib/layouts/FullPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Field,
    Heading,
    HStack,
    Icon,
    Input,
    Logo,
    Select,
    Stack,
    SupporterBadge,
    Text,
  } from '@immich/ui';
  import { mdiCameraOff, mdiCheck, mdiCloudUpload } from '@mdi/js';
  import { AssetType, AssetTypeNames, exifUploaderManager } from './exif-uploader-manager.svelte';
  import { scale } from 'svelte/transition';

  const onDragAndDropUpload = (files?: FileList | File[]) => {
    // Handle the uploaded files here
    console.log('Files uploaded:', files);

    for (const file of files || []) {
      // Add each file to the exif uploader manager
      exifUploaderManager.addAsset(file);
    }
  };

  const disabledMetadataEditing = $derived(exifUploaderManager.selection.length === 0);
</script>

<FullPageLayout size="full">
  <DragAndDropUpload onFiles={onDragAndDropUpload} />

  <div class="z-0">
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary" tag="h1">Contribute to EXIF Dataset</Heading>
    </SupporterBadge>
  </div>
  <section>
    <!-- Columns -->
    <div class="flex flex-1 my-4 gap-4">
      <div class="h-full w-2/3 gap-4 flex flex-col">
        <Card color="secondary">
          <CardHeader>
            <div class="flex justify-between">
              <CardTitle>Uploads</CardTitle>
              <HStack gap={2}>
                <Button onclick={() => exifUploaderManager.selectAll()} size="small">Select All</Button>
                <Button onclick={() => exifUploaderManager.deselectAll()} size="small">Deselect All</Button>
              </HStack>
            </div>
          </CardHeader>
          <CardBody>
            {#if exifUploaderManager.assets.length == 0}
              <Text class="text-center text-primary font-bold text-lg flex items-center justify-center gap-2">
                <span class="inline-flex items-center">
                  <Icon icon={mdiCloudUpload} class="inline-block align-middle w-5 h-5" />
                </span>
                <span class="inline-block align-middle">Drag files to upload</span>
              </Text>
            {:else}
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each exifUploaderManager.assets as asset (asset.id)}
                  <Card
                    color="primary"
                    class="flex flex-col items-center justify-between relative"
                    onclick={() => exifUploaderManager.toggleSelect(asset)}
                  >
                    {#if exifUploaderManager.selection.includes(asset)}
                      <div
                        class="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow light"
                        transition:scale={{ duration: 100 }}
                      >
                        <Icon icon={mdiCheck} class="w-5 h-5 text-primary" />
                      </div>
                    {/if}

                    <img
                      src={URL.createObjectURL(asset.data)}
                      alt={asset.name}
                      class="w-full object-cover rounded h-48"
                      loading="lazy"
                      id={`preview-${asset.id}`}
                      draggable="false"
                      onerror={() => {
                        const errorElem = document.getElementById(`error-${asset.id}`);
                        if (errorElem) errorElem.style = '';

                        const previewElem = document.getElementById(`preview-${asset.id}`);
                        if (previewElem) previewElem.style.display = 'none';
                      }}
                    />
                    <!-- image loading error -->
                    <div
                      style="display: none;"
                      class="flex flex-col items-center justify-center p-4 bg-neutral-900/10 w-full h-48"
                      id={`error-${asset.id}`}
                    >
                      <Icon icon={mdiCameraOff} class="w-8 h-8 mb-2" />
                      <Text class="text-center text-gray-50">This file cannot be viewed on the web.</Text>
                    </div>

                    <div class="gap-2 m-4">
                      <Text class="text-lg font-semibold text-ellipsis line-clamp-1 mb-2">{asset.name}</Text>
                      <Text class="text-sm text-gray-200">
                        {asset.metadata.cameraMfg}
                      </Text>
                      <Text class="text-sm text-gray-200">
                        {asset.metadata.cameraModel}
                      </Text>
                      <Text class="text-sm text-white bg-red-400 p-1 mt-2 inline-block w-auto rounded">
                        {AssetTypeNames[asset.metadata.type]}
                      </Text>
                    </div>
                  </Card>
                {/each}
              </div>
            {/if}
          </CardBody>
        </Card>
      </div>
      <div class="h-full w-1/3">
        <Card color="secondary" class="h-full w-full">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardBody>
            <Stack gap={4}>
              <Field label="Image Type" disabled={disabledMetadataEditing}>
                <Select
                  data={Object.keys(AssetTypeNames).map((key) => ({
                    label: AssetTypeNames[key as keyof typeof AssetTypeNames],
                    value: key,
                  }))}
                  onChange={(e) => exifUploaderManager.updateSelectedMetadata('type', e.value as AssetType)}
                />
              </Field>
              <Field label="Camera Brand" disabled={disabledMetadataEditing}>
                <Input
                  placeholder=""
                  onchange={(e) =>
                    exifUploaderManager.updateSelectedMetadata('cameraMfg', (e?.target as HTMLInputElement).value)}
                />
              </Field>
              <Field label="Camera Model" disabled={disabledMetadataEditing}>
                <Input
                  placeholder=""
                  onchange={(e) =>
                    exifUploaderManager.updateSelectedMetadata('cameraModel', (e?.target as HTMLInputElement).value)}
                />
              </Field>
            </Stack>
          </CardBody>
        </Card>
        <Button
          color="primary"
          class="w-full mt-4"
          onclick={() => console.log('Submit to Dataset')}
          disabled={exifUploaderManager.assets.length === 0}
        >
          <Icon icon={mdiCheck} class="inline-block align-middle w-5 h-5 mr-2" />
          Submit to Dataset
        </Button>
      </div>
    </div>
  </section>
</FullPageLayout>
