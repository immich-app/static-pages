<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import SquareEditor from '$lib/components/SquareEditor.svelte';
  import UploadErrorModal from '$lib/components/UploadErrorModal.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import {
    type AssetTypeAge,
    AssetTypeAgeNames,
    type AssetTypeAnimal,
    AssetTypeAnimalNames,
    AssetTypeBreedNames,
    petsUploaderManager,
  } from '$lib/pets-uploader-manager.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Field,
    Heading,
    Icon,
    IconButton,
    Input,
    modalManager,
    Select,
    Stack,
    Text,
    toastManager,
  } from '@immich/ui';
  import {
    mdiCameraOff,
    mdiCheck,
    mdiCloudUpload,
    mdiImageFilterCenterFocus,
    mdiImageRemoveOutline,
    mdiLock,
    mdiLockOpenVariant,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    //mdiPaw,
    mdiPlus,
    mdiTooltipMinusOutline,
    mdiVectorSquare,
    mdiVectorSquareRemove,
  } from '@mdi/js';
  import { fade, scale } from 'svelte/transition';

  //let shiftHeld = $state(false);
  let displayInstructions = $state(true);
  //let disabledMetadataEditing = $derived(petsUploaderManager.selection.length === 0);
  let selectedAssetTypeAge = $derived(petsUploaderManager.selectedMetadata.age);
  let selectedAssetTypeAnimal = $derived(petsUploaderManager.selectedMetadata.animal);
  let petCount = $state(0);
  let petAsset = $derived(petsUploaderManager.assets[petCount]);
  let squareEditor = $state<{
    addSquare: () => void;
    deleteSquare: () => void;
    deselectr: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
  }>();
  let petImageUrl = $derived(petAsset ? URL.createObjectURL(petAsset.preview) : '');
  let activeSquare = $state(false);
  let buttonEnable = $derived(
    petsUploaderManager.selectedMetadata.name &&
      petsUploaderManager.selectedMetadata.animal &&
      petsUploaderManager.selectedMetadata.age &&
      petsUploaderManager.selectedMetadata.breed,
  );
  let panEnabled = $state(true);

  const createSquare = () => {
    const asset = petsUploaderManager.assets[petCount];
    if (asset) {
      petsUploaderManager.deselectAll();
      petsUploaderManager.toggleSelect(asset);
    }
    squareEditor?.addSquare();
  };

  const onDragAndDropUpload = (files?: FileList | File[]) => {
    for (const file of files || []) {
      try {
        petsUploaderManager.addAsset(file);
      } catch (error) {
        console.error('Failed to add asset:', error);
      }
    }
  };

  const doUpload = async () => {
    const uploadResult = await modalManager.show(UploadModal, {
      dataset: petsUploaderManager,
      datasetName: 'pets',
    });

    if (uploadResult.cancelled) {
      return;
    }

    if (uploadResult.failedIds.length === 0) {
      globalThis.location.href = `/thank-you?dataset=pets`;
      return;
    }

    // remove the failed assets from the manager
    for (const assetId of uploadResult.failedIds) {
      petsUploaderManager.deleteById(assetId);
    }

    await modalManager.show(UploadErrorModal);
  };

  //   const onKeyDown = (event: KeyboardEvent) => {
  //     if (event.key === 'Shift') {
  //       shiftHeld = true;
  //     }
  //   };

  //   const onKeyUp = (event: KeyboardEvent) => {
  //     if (event.key === 'Shift') {
  //       shiftHeld = false;
  //     }
  //   };
  //
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'a', meta: true }, onShortcut: () => petsUploaderManager.selectAll() },
    { shortcut: { key: 'a', ctrl: true }, onShortcut: () => petsUploaderManager.selectAll() },
    { shortcut: { key: 'Escape' }, onShortcut: () => petsUploaderManager.deselectAll() },
  ]}
  // onkeydown={onKeyDown}
  // onkeyup={onKeyUp}
/>

<DragAndDropUpload onFiles={onDragAndDropUpload} />

<div class="mb-4">
  <Heading tag="h1" size="giant">Pets Dataset</Heading>
  <Text color="muted">Contribute to the Pets Dataset (Minimum requirement of 10-15 images per pet)</Text>
</div>

{#if displayInstructions}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    transition:fade|global={{ duration: 150 }}
  >
    <Card color="secondary" class="w-full max-w-lg">
      <CardHeader>
        <div class="flex justify-between">
          <CardTitle>Instructions</CardTitle>
        </div>
      </CardHeader>
      <CardBody>hi</CardBody>
      <CardFooter>
        <Button color="primary" onclick={() => (displayInstructions = false)}>Ok</Button>
      </CardFooter>
    </Card>
  </div>
{/if}

{#if petsUploaderManager.assets.length === 0}
  <button onclick={() => petsUploaderManager.openFilePicker()} class="w-full">
    <Card color="secondary">
      <CardBody>
        <div class="flex size-full min-h-[25dvh] flex-col justify-center gap-2 text-center align-middle">
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
    <div class="my-4 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr_minmax(280px,340px)]">
      <Card color="secondary" class="h-fit lg:w-auto">
        <CardBody>
          <Stack gap={3}>
            <IconButton
              icon={mdiPlus}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Add More"
              onclick={() => petsUploaderManager.openFilePicker()}
            />
            <IconButton
              icon={mdiTooltipMinusOutline}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Display Instructions"
              onclick={() => (displayInstructions = true)}
            />

            {#if activeSquare}
              <div transition:scale={{ duration: 100 }}>
                <IconButton
                  icon={mdiVectorSquareRemove}
                  size="small"
                  color="danger"
                  variant="ghost"
                  aria-label="Delete Square"
                  onclick={() => {
                    squareEditor?.deleteSquare();
                  }}
                />
              </div>
            {:else}
              <IconButton
                icon={mdiVectorSquare}
                size="small"
                color="secondary"
                variant="ghost"
                aria-label="Add Square"
                onclick={createSquare}
              />
            {/if}
            <IconButton
              icon={mdiImageRemoveOutline}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Delete Photo"
              onclick={() => {
                petsUploaderManager.deselectAll();
                petsUploaderManager.toggleSelect(petAsset);
                petsUploaderManager.deleteSelected();
              }}
            />
            <IconButton
              icon={mdiMagnifyPlusOutline}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Zoom in"
              onclick={() => squareEditor?.zoomIn()}
            />
            <IconButton
              icon={mdiMagnifyMinusOutline}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Zoom out"
              onclick={() => squareEditor?.zoomOut()}
            />
            <IconButton
              icon={mdiImageFilterCenterFocus}
              size="small"
              color="secondary"
              variant="ghost"
              aria-label="Center image"
              onclick={() => squareEditor?.resetView()}
            />
            <IconButton
              icon={panEnabled ? mdiLockOpenVariant : mdiLock}
              size="small"
              color={panEnabled ? 'primary' : 'secondary'}
              aria-label={panEnabled ? 'Lock image dragging' : 'Unlock image dragging'}
              onclick={() => (panEnabled = !panEnabled)}
            />
          </Stack>
        </CardBody>
      </Card>

      <Card color="secondary">
        <CardBody>
          <Stack gap={4}>
            <div class="flex min-h-[50dvh] items-center justify-center overflow-clip border-8 bg-neutral-900/10">
              {#if petAsset}
                <SquareEditor
                  bind:this={squareEditor}
                  src={petImageUrl}
                  alt={petAsset.name}
                  boxes={petAsset.boxes}
                  bind:panEnabled
                  onChange={(boxes) => petsUploaderManager.setBoxes(petAsset.metadata.assetId, boxes)}
                  onActiveChange={(active) => (activeSquare = active)}
                />
              {:else}
                <div class="flex-flex col items-center gap-2 p-8 text-center">
                  <Icon icon={mdiCameraOff} class="size-8" />
                  <Text>No Image Selected</Text>
                </div>
              {/if}
            </div>

            <!-- {#if petAsset}
              <div transition:scale={{ duration: 100 }} class="flex items-center justify-center"></div>
              <HStack gap={4} class="flex-wrap justify-center">
                <Text size="small" color={petAsset.metadata.name ? 'primary' : 'danger'}>
                  <Icon icon={mdiRename} class="mb-0.5 inline-block size-4 align-middle" />
                  {petAsset.metadata.name || 'Missing Name'}
                </Text>

                <Text size="small" color={petAsset.metadata.age ? 'primary' : 'danger'}>
                  <Icon icon={mdiClock} class="mb-0.5 inline-block size-4 align-middle" />
                  {petAsset.metadata.age || 'Missing Age'}
                </Text>

                <Text size="small" color={petAsset.metadata.animal ? 'primary' : 'danger'}>
                  <Icon icon={mdiPaw} class="mb-0.5 inline-block size-4 align-middle" />
                  {petAsset.metadata.animal || 'Missing Animal'}
                </Text>

                <Text size="small" color={petAsset.metadata.breed ? 'primary' : 'danger'}>
                  <Icon icon={mdiHelp} class="mb-0.5 inline-block size-4 align-middle" />
                  {petAsset.metadata.breed || 'Missing Breed'}
                </Text>
              </HStack>
            {/if} -->

            <div class="flex gap-2 overflow-x-auto pb-2 select-none">
              {#each petsUploaderManager.assets as asset, i (asset.metadata.assetId)}
                {@const selected = petsUploaderManager.selection.includes(asset)}
                <button
                  type="button"
                  color={selected ? 'primary' : 'secondary'}
                  class="relative shrink-0 rounded-lg border-3 {i === petCount
                    ? 'border-primary'
                    : 'dark:border-secondary'}"
                  onclick={() => (petCount = i)}
                >
                  {#if selected}
                    <div class="light absolute inset-e-1 top-0.5 bg-primary p-0.5">
                      <Icon icon={mdiCheck} class="size-3 text-light" />
                    </div>
                  {/if}

                  <img
                    src={URL.createObjectURL(asset.preview)}
                    alt={asset.name}
                    class="size-20 rounded-sm object-cover"
                    loading="eager"
                    draggable="false"
                    onerror={() => {
                      toastManager.danger(`This file couldn't be displayed and was removed.`);
                      petsUploaderManager.deleteById(asset.metadata.assetId!);
                    }}
                  />
                </button>
              {/each}
            </div>

            <Button
              color="primary"
              class="light w-full"
              leadingIcon={mdiCheck}
              onclick={() => {
                if (petsUploaderManager.assets.length < 10) {
                  toastManager.show({
                    title: 'Warning',
                    description: 'Minimum 10 images per pet required',
                    color: 'warning',
                  });
                  return;
                }
                doUpload();
              }}
              disabled={petsUploaderManager.submitDisabled}
            >
              Submit {petsUploaderManager.assets.length} asset(s) to dataset
            </Button>
          </Stack>
        </CardBody>
      </Card>
      <Card color="secondary">
        <CardHeader>
          <CardTitle>Pet Information</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap={4}>
            <Field label="Name" disabled={!activeSquare}>
              <Input
                placeholder=""
                onchange={(e) =>
                  petsUploaderManager.updateSelectedMetadata('name', (e?.target as HTMLInputElement).value)}
                bind:value={petsUploaderManager.selectedMetadata.name}
              />
            </Field>
            <Field label="Age" disabled={!activeSquare}>
              <Select
                onChange={(e) => petsUploaderManager.updateSelectedMetadata('age', e)}
                options={Object.entries(AssetTypeAgeNames).map(([value, label]) => ({
                  value: value as AssetTypeAge,
                  label,
                }))}
                bind:value={selectedAssetTypeAge}
              />
            </Field>
            <Field label="Animal" disabled={!activeSquare}>
              <Select
                onChange={(e) => {
                  petsUploaderManager.updateSelectedMetadata('animal', e);
                  petsUploaderManager.updateSelectedMetadata('breed', undefined);
                }}
                options={Object.entries(AssetTypeAnimalNames).map(([value, label]) => ({
                  value: value as AssetTypeAnimal,
                  label,
                }))}
                bind:value={selectedAssetTypeAnimal}
              />
            </Field>
            <Field label="Breed" disabled={!activeSquare || !selectedAssetTypeAnimal}>
              <Select
                onChange={(e) => petsUploaderManager.updateSelectedMetadata('breed', e)}
                options={(selectedAssetTypeAnimal ? AssetTypeBreedNames[selectedAssetTypeAnimal] : []).map((breed) => ({
                  value: breed,
                  label: breed,
                }))}
                bind:value={petsUploaderManager.selectedMetadata.breed}
              />
            </Field>
            <Button
              onclick={() => {
                if (petAsset) {
                  petsUploaderManager.deselectAll();
                  petsUploaderManager.toggleSelect(petAsset);
                }
              }}
              leadingIcon={mdiPlus}
              class="light w-35"
              size="small"
              aria-label="Create Pet"
              disabled={!buttonEnable}
              >Create Pet
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </div>
  </section>
{/if}
