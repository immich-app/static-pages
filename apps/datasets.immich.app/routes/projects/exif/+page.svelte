<script lang="ts">
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
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
    Modal,
    ModalBody,
    ModalFooter,
    Select,
    Stack,
    Text,
  } from '@immich/ui';
  import { mdiCamera, mdiCameraOff, mdiCheck, mdiCloudUpload, mdiDomain, mdiHelp, mdiPlus, mdiTrashCan } from '@mdi/js';
  import { scale } from 'svelte/transition';
  import { AssetTypeIcons, AssetTypeNames, exifUploaderManager, type AssetType } from './exif-uploader-manager.svelte';
  import { shortcuts } from '$lib/actions/shortcut';

  let uploadModalShown = $state(false);
  let uploadFailed = $state(false);
  let shiftHeld = $state(false);

  let disabledMetadataEditing = $derived(exifUploaderManager.selection.length === 0);
  let assetTypeSelectState = $derived.by(() => {
    const type = exifUploaderManager.selectedMetadata.captureType;
    return type ? { value: type, label: AssetTypeNames[type] } : undefined;
  });

  const onDragAndDropUpload = (files?: FileList | File[]) => {
    for (const file of files || []) {
      exifUploaderManager.addAsset(file);
    }
  };

  const showImagePreviewError = (assetId: string) => {
    const errorElem = document.getElementById(`error-${assetId}`);
    if (errorElem) errorElem.style = '';

    const previewElem = document.getElementById(`preview-${assetId}`);
    if (previewElem) previewElem.style.display = 'none';
  };

  const onUploadFailed = () => {
    uploadModalShown = false;
    uploadFailed = true;
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
        <div class="flex text-center flex-col align-middle justify-center min-h-[25vh] h-full w-full gap-2">
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
    <div class="grid grid-cols-1 md:grid-cols-[auto_minmax(400px,_1fr)] my-4 gap-4">
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
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each exifUploaderManager.assets as asset (asset.id)}
              {@const selected = exifUploaderManager.selection.includes(asset)}
              <Card
                color={selected ? 'primary' : 'secondary'}
                class="flex flex-col items-center justify-between relative border-2 {selected
                  ? 'border-primary'
                  : 'dark:border-secondary'}"
                onclick={() => exifUploaderManager.toggleSelect(asset, shiftHeld)}
              >
                {#if selected}
                  <div
                    class="absolute top-2 start-2 bg-primary rounded-full p-1 shadow light"
                    transition:scale={{ duration: 100 }}
                  >
                    <Icon icon={mdiCheck} class="w-4 h-4 text-light" />
                  </div>
                {/if}

                <img
                  src={URL.createObjectURL(asset.preview)}
                  alt={asset.name}
                  class="w-full h-48 object-cover"
                  loading="lazy"
                  id="preview-{asset.id}"
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
                  <Text size="large" class="font-semibold text-ellipsis line-clamp-1 mb-2">{asset.name}</Text>

                  <Text size="medium" color={asset.metadata.captureType ? 'primary' : 'danger'}>
                    <Icon
                      icon={AssetTypeIcons[asset.metadata.captureType as AssetType] || mdiHelp}
                      class="inline-block align-middle w-4 h-4 mb-0.5"
                    />
                    {AssetTypeNames[asset.metadata.captureType as AssetType] || 'Missing type'}
                  </Text>

                  <Text size="medium" color={asset.metadata.cameraMake ? 'primary' : 'danger'}>
                    <Icon icon={mdiDomain} class="inline-block align-middle w-4 h-4 mb-0.5" />
                    {asset.metadata.cameraMake || 'Missing brand'}
                  </Text>

                  <Text size="medium" color={asset.metadata.cameraModel ? 'primary' : 'danger'}>
                    <Icon icon={mdiCamera} class="inline-block align-middle w-4 h-4 mb-0.5" />
                    {asset.metadata.cameraModel || 'Missing model'}
                  </Text>
                </div>
              </Card>
            {/each}
          </div>

          <div class="flex justify-end">
            <Button
              color="primary"
              class="mt-4 light w-full"
              leadingIcon={mdiCheck}
              onclick={() => (uploadModalShown = true)}
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
                onChange={(e) => exifUploaderManager.updateSelectedMetadata('captureType', e.value as AssetType)}
                data={Object.entries(AssetTypeNames).map(([value, label]) => ({
                  value,
                  label,
                }))}
                bind:value={assetTypeSelectState}
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

{#if uploadModalShown}
  <UploadModal
    onClose={() => (uploadModalShown = false)}
    dataset={exifUploaderManager}
    onFailed={onUploadFailed}
    datasetName="exif"
  />
{/if}

{#if uploadFailed}
  <Modal title="Upload failed" size="medium" open={uploadFailed} onClose={() => (uploadFailed = false)}>
    <ModalBody>
      <p>There was an error while trying to upload your dataset. Please try again later.</p>
    </ModalBody>
    <ModalFooter>
      <Button onclick={() => (uploadFailed = false)} shape="round">Close</Button>
    </ModalFooter>
  </Modal>
{/if}
