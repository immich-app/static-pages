<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import UploadErrorModal from '$lib/components/UploadErrorModal.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import {
    AssetTypeIcons,
    AssetTypeNames,
    exifUploaderManager,
    type AssetType,
  } from '$lib/exif-uploader-manager.svelte';
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
    IconButton,
    Input,
    modalManager,
    Select,
    Stack,
    Text,
  } from '@immich/ui';
  import { mdiCamera, mdiCameraOff, mdiCheck, mdiCloudUpload, mdiDomain, mdiHelp, mdiPlus, mdiTrashCan } from '@mdi/js';
  import { scale } from 'svelte/transition';

  let shiftHeld = $state(false);

  let disabledMetadataEditing = $derived(exifUploaderManager.selection.length === 0);
  let selectedAssetType = $derived(exifUploaderManager.selectedMetadata.captureType);

  const onDragAndDropUpload = (files?: FileList | File[]) => {
    for (const file of files || []) {
      try {
        exifUploaderManager.addAsset(file);
      } catch (error) {
        console.error('Failed to add asset:', error);
      }
    }
  };

  const showImagePreviewError = (assetId: string) => {
    const errorElem = document.getElementById(`error-${assetId}`);
    if (errorElem) errorElem.style = '';

    const previewElem = document.getElementById(`preview-${assetId}`);
    if (previewElem) previewElem.style.display = 'none';
  };

  const doUpload = async () => {
    const uploadResult = await modalManager.show(UploadModal, {
      dataset: exifUploaderManager,
      datasetName: 'exif',
    });

    if (uploadResult.cancelled) {
      return;
    }

    if (uploadResult.failedIds.length === 0) {
      window.location.href = `/thank-you?dataset=exif`;
      return;
    }

    // remove the failed assets from the manager
    for (const assetId of uploadResult.failedIds) {
      exifUploaderManager.deleteById(assetId);
    }

    await modalManager.show(UploadErrorModal);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      shiftHeld = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      shiftHeld = false;
    }
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'a', meta: true }, onShortcut: () => exifUploaderManager.selectAll() },
    { shortcut: { key: 'a', ctrl: true }, onShortcut: () => exifUploaderManager.selectAll() },
    { shortcut: { key: 'Escape' }, onShortcut: () => exifUploaderManager.deselectAll() },
  ]}
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
/>

<DragAndDropUpload onFiles={onDragAndDropUpload} />

<div class="mb-4">
  <Heading tag="h1" size="giant">EXIF Dataset</Heading>
  <Text color="muted">Contribute to the EXIF Dataset</Text>
</div>

{#if exifUploaderManager.assets.length === 0}
  <button onclick={() => exifUploaderManager.openFilePicker()} class="w-full">
    <Card color="secondary">
      <CardBody>
        <div class="flex h-full min-h-[25vh] w-full flex-col justify-center gap-2 text-center align-middle">
          <Heading size="large">Ready to add some photos?</Heading>
          <Text size="small">Drag photos anywhere to upload</Text>
          <div class="flex justify-center">
            <Button color="primary" size="small" leadingIcon={mdiCloudUpload}>Select Files</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  </button>
{:else}
  <section>
    <!-- Columns -->
    <div class="my-4 grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(400px,1fr)]">
      <Card color="secondary">
        <CardHeader>
          <div class="flex justify-between">
            <CardTitle>Uploads</CardTitle>
            {#if exifUploaderManager.assets.length > 0}
              <HStack gap={2}>
                <Button onclick={() => exifUploaderManager.selectAll()} size="small">Select All</Button>
                <Button onclick={() => exifUploaderManager.deselectAll()} size="small">Deselect All</Button>
                <Button
                  onclick={() => exifUploaderManager.openFilePicker()}
                  leadingIcon={mdiPlus}
                  size="small"
                  aria-label="Upload"
                >
                  Add More
                </Button>
                {#if exifUploaderManager.selection.length > 0}
                  <div transition:scale={{ duration: 100 }}>
                    <IconButton
                      onclick={() => exifUploaderManager.deleteSelected()}
                      icon={mdiTrashCan}
                      size="small"
                      color="danger"
                      aria-label="Delete Selected"
                    />
                  </div>
                {/if}
              </HStack>
            {/if}
          </div>
        </CardHeader>
        <CardBody>
          <div class="grid grid-cols-2 gap-4 select-none md:grid-cols-3 lg:grid-cols-4">
            {#each exifUploaderManager.assets as asset (asset.metadata.assetId)}
              {@const selected = exifUploaderManager.selection.includes(asset)}
              <Card
                color={selected ? 'primary' : 'secondary'}
                class="relative flex flex-col items-center justify-between border-2 {selected
                  ? 'border-primary'
                  : 'dark:border-secondary'}"
                onclick={() => exifUploaderManager.toggleSelect(asset, shiftHeld)}
              >
                {#if selected}
                  <div
                    class="bg-primary light absolute start-2 top-2 rounded-full p-1 shadow"
                    transition:scale={{ duration: 100 }}
                  >
                    <Icon icon={mdiCheck} class="text-light h-4 w-4" />
                  </div>
                {/if}

                <img
                  src={URL.createObjectURL(asset.preview)}
                  alt={asset.name}
                  class="h-48 w-full object-cover"
                  loading="lazy"
                  id="preview-{asset.metadata.assetId}"
                  draggable="false"
                  onerror={() => showImagePreviewError(asset.metadata.assetId!)}
                />

                <!-- image loading error -->
                <div
                  style="display: none;"
                  class="flex h-48 w-full flex-col items-center justify-center bg-neutral-900/10 p-4"
                  id={`error-${asset.metadata.assetId}`}
                >
                  <Icon icon={mdiCameraOff} class="mb-2 h-8 w-8" />
                  <Text class="text-center">This file cannot be viewed on the web.</Text>
                </div>

                <div class="m-4 gap-2">
                  <Text size="large" fontWeight="semi-bold" class="mb-2 line-clamp-1 text-ellipsis">{asset.name}</Text>

                  <Text size="medium" color={asset.metadata.captureType ? 'primary' : 'danger'}>
                    <Icon
                      icon={AssetTypeIcons[asset.metadata.captureType as AssetType] || mdiHelp}
                      class="mb-0.5 inline-block h-4 w-4 align-middle"
                    />
                    {AssetTypeNames[asset.metadata.captureType as AssetType] || 'Missing type'}
                  </Text>

                  <Text size="medium" color={asset.metadata.cameraMake ? 'primary' : 'danger'}>
                    <Icon icon={mdiDomain} class="mb-0.5 inline-block h-4 w-4 align-middle" />
                    {asset.metadata.cameraMake || 'Missing brand'}
                  </Text>

                  <Text size="medium" color={asset.metadata.cameraModel ? 'primary' : 'danger'}>
                    <Icon icon={mdiCamera} class="mb-0.5 inline-block h-4 w-4 align-middle" />
                    {asset.metadata.cameraModel || 'Missing model'}
                  </Text>
                </div>
              </Card>
            {/each}
          </div>

          <div class="flex justify-end">
            <Button
              color="primary"
              class="light mt-4 w-full"
              leadingIcon={mdiCheck}
              onclick={doUpload}
              disabled={exifUploaderManager.submitDisabled}
            >
              Submit {exifUploaderManager.assets.length} asset(s) to dataset
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card color="secondary">
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap={4}>
            <Field label="Capture Type" disabled={disabledMetadataEditing}>
              <Select
                onChange={(e) => exifUploaderManager.updateSelectedMetadata('captureType', e)}
                options={Object.entries(AssetTypeNames).map(([value, label]) => ({
                  value: value as AssetType,
                  label,
                }))}
                bind:value={selectedAssetType}
              />
            </Field>
            <Field label="Camera Brand" disabled={disabledMetadataEditing}>
              <Input
                placeholder=""
                onchange={(e) =>
                  exifUploaderManager.updateSelectedMetadata('cameraMake', (e?.target as HTMLInputElement).value)}
                bind:value={exifUploaderManager.selectedMetadata.cameraMake}
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
    </div>
  </section>
{/if}
