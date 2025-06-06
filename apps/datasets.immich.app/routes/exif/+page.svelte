<script lang="ts">
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import FullPageLayout from '$lib/layouts/FullPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Checkbox,
    Field,
    Heading,
    HStack,
    Icon,
    Input,
    Logo,
    Modal,
    ModalBody,
    ModalFooter,
    Stack,
    SupporterBadge,
    Text,
  } from '@immich/ui';
  import { mdiCameraOff, mdiCheck, mdiCloudUpload } from '@mdi/js';
  import { AssetType, AssetTypeNames, exifUploaderManager } from './exif-uploader-manager.svelte';
  import { scale } from 'svelte/transition';

  let modalOpen = $state(false);

  const onDragAndDropUpload = (files?: FileList | File[]) => {
    for (const file of files || []) {
      // Add each file to the exif uploader manager
      exifUploaderManager.addAsset(file);
    }
  };

  const showImagePreviewError = (assetId: string) => {
    const errorElem = document.getElementById(`error-${assetId}`);
    if (errorElem) errorElem.style = '';

    const previewElem = document.getElementById(`preview-${assetId}`);
    if (previewElem) previewElem.style.display = 'none';
  };

  const segmentedControlRoundedClass = (idx: number, total: number) => {
    if (idx != 0 && idx != total - 1) {
      return 'rounded-none';
    }

    if (idx === 0 && total > 1) {
      return 'rounded-none rounded-l-lg ';
    }

    if (idx === total - 1 && total > 1) {
      return 'rounded-none rounded-r-lg';
    }
  };

  const disabledMetadataEditing = $derived(exifUploaderManager.selection.length === 0);

  const submitDisabled = $derived(
    exifUploaderManager.assets.length === 0 ||
      exifUploaderManager.assets.some(
        (asset) => !asset.metadata.cameraMfg || !asset.metadata.cameraModel || !asset.metadata.type,
      ),
  );
</script>

<FullPageLayout size="full">
  <DragAndDropUpload onFiles={onDragAndDropUpload} />

  <div>
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
              {#if exifUploaderManager.assets.length > 0}
                <HStack gap={2}>
                  <Button onclick={() => exifUploaderManager.selectAll()} size="small">Select All</Button>
                  <Button onclick={() => exifUploaderManager.deselectAll()} size="small">Deselect All</Button>
                </HStack>
              {/if}
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
                        class="absolute top-2 right-2 bg-white rounded-full p-1 shadow light"
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
                      onerror={() => showImagePreviewError(asset.id)}
                    />
                    <!-- image loading error -->
                    <div
                      style="display: none;"
                      class="flex flex-col items-center justify-center p-4 bg-neutral-900/10 w-full h-48"
                      id={`error-${asset.id}`}
                    >
                      <Icon icon={mdiCameraOff} class="w-8 h-8 mb-2" />
                      <Text class="text-center">This file cannot be viewed on the web.</Text>
                    </div>

                    <div class="gap-2 m-4">
                      <Text class="text-lg font-semibold text-ellipsis line-clamp-1 mb-2">{asset.name}</Text>
                      <Text class="text-sm text-gray-700 dark:text-gray-200">
                        {asset.metadata.cameraMfg}
                      </Text>
                      <Text class="text-sm text-gray-700 dark:text-gray-200">
                        {asset.metadata.cameraModel}
                      </Text>
                      {#if asset.metadata.type}
                        <Text class="text-sm text-white bg-neutral-500 p-1 mt-2 px-2 inline-block w-auto rounded">
                          {AssetTypeNames[asset.metadata.type]}
                        </Text>
                      {/if}
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
                <HStack gap={0}>
                  <!-- loop through all enum types and make a segmented control -->
                  {#each Object.values(AssetType) as type, idx (type)}
                    <Button
                      color="primary"
                      size="small"
                      onclick={() => exifUploaderManager.updateSelectedMetadata('type', type)}
                      disabled={disabledMetadataEditing}
                      class={segmentedControlRoundedClass(idx, Object.values(AssetType).length) +
                        ' ' +
                        (exifUploaderManager.selectedMetadata.type === type ? 'bg-primary/80' : '')}
                    >
                      {AssetTypeNames[type]}
                    </Button>
                  {/each}
                </HStack>
              </Field>
              <Field label="Camera Brand" disabled={disabledMetadataEditing}>
                <Input
                  placeholder=""
                  onchange={(e) =>
                    exifUploaderManager.updateSelectedMetadata('cameraMfg', (e?.target as HTMLInputElement).value)}
                  bind:value={exifUploaderManager.selectedMetadata.cameraMfg}
                />
              </Field>
              <Field label="Camera Model" disabled={disabledMetadataEditing}>
                <Input
                  placeholder=""
                  onchange={(e) =>
                    exifUploaderManager.updateSelectedMetadata('cameraModel', (e?.target as HTMLInputElement).value)}
                  bind:value={exifUploaderManager.selectedMetadata.cameraModel}
                />
              </Field>
            </Stack>
          </CardBody>
        </Card>
        <Button color="primary" class="w-full mt-4 light" onclick={() => (modalOpen = true)} disabled={submitDisabled}>
          <Icon icon={mdiCheck} class="inline-block align-middle w-5 h-5 mr-2" />
          Submit to Dataset
        </Button>
      </div>
    </div>
  </section>
  {#if modalOpen}
    <Modal title="Dataset Agreement" size="medium" onClose={() => (modalOpen = false)}>
      <ModalBody>
        <Stack gap={4}>
          <Field
            label="Creative Commons 0"
            description="I declare that I own full rights to this file and I hereby release it under the CCO license into the public domain."
            required
          >
            <Checkbox />
          </Field>
          <Field
            label="File Modification"
            description="The file is manually copied from card/camera, without using any software like Nikon Transfer, and hasn't been modified in any way."
            required
          >
            <Checkbox />
          </Field>
          <Field label="Contact Email" required>
            <Input placeholder="contact@example.com" />
          </Field>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button onclick={() => (modalOpen = false)} shape="round">Submit Dataset</Button>
      </ModalFooter>
    </Modal>
  {/if}
</FullPageLayout>
