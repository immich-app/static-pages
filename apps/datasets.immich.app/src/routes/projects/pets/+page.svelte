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
    mdiTrashCanOutline,
    mdiVectorSquare,
    mdiVectorSquareRemove,
  } from '@mdi/js';
  import { scale } from 'svelte/transition';

  //let shiftHeld = $state(false);
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
    assignActivePet: (petId: string | undefined) => void;
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
            <Button
              onclick={() => petsUploaderManager.openFilePicker()}
              leadingIcon={mdiPlus}
              size="small"
              variant="outline"
              aria-label="Add More"
              >Add More
            </Button>

            {#if activeSquare}
              <div transition:scale={{ duration: 100 }}>
                <Button
                  leadingIcon={mdiVectorSquareRemove}
                  size="small"
                  color="danger"
                  variant="outline"
                  aria-label="Delete Square"
                  onclick={() => {
                    squareEditor?.deleteSquare();
                  }}
                  >Delete Square
                </Button>
              </div>
            {:else}
              <Button
                leadingIcon={mdiVectorSquare}
                size="small"
                variant="outline"
                aria-label="Add Square"
                onclick={createSquare}
                >Add Square
              </Button>
            {/if}
            <Button
              leadingIcon={mdiImageRemoveOutline}
              size="small"
              variant="outline"
              aria-label="Delete Photo"
              color="danger"
              onclick={() => {
                petsUploaderManager.deselectAll();
                petsUploaderManager.toggleSelect(petAsset);
                petsUploaderManager.deleteSelected();
              }}
              >Delete Photo
            </Button>
            <Button
              leadingIcon={mdiMagnifyPlusOutline}
              size="small"
              variant="outline"
              aria-label="Zoom in"
              onclick={() => squareEditor?.zoomIn()}
              >Zoom In
            </Button>
            <Button
              leadingIcon={mdiMagnifyMinusOutline}
              size="small"
              variant="outline"
              aria-label="Zoom out"
              onclick={() => squareEditor?.zoomOut()}
              >Zoom Out
            </Button>
            <Button
              leadingIcon={mdiImageFilterCenterFocus}
              size="small"
              variant="outline"
              aria-label="Center image"
              onclick={() => squareEditor?.resetView()}
              >Center Image
            </Button>
          </Stack>
        </CardBody>
      </Card>

      <Card color="secondary">
        <CardBody>
          <Stack gap={4}>
            <div class="relative flex min-h-auto items-center justify-center overflow-clip border-8 bg-neutral-900/10">
              {#if petAsset}
                <SquareEditor
                  bind:this={squareEditor}
                  src={petImageUrl}
                  alt={petAsset.name}
                  boxes={petAsset.boxes}
                  bind:panEnabled
                  onChange={(boxes) => petsUploaderManager.setBoxes(petAsset.metadata.assetId, boxes)}
                  onActiveChange={(active) => {
                    activeSquare = active;
                    if (active && petAsset) {
                      petsUploaderManager.deselectAll();
                      petsUploaderManager.toggleSelect(petAsset);
                    }
                  }}
                >
                  {#snippet follow(box)}
                    {@const assignedPet = petsUploaderManager.getPet(box.petId)}
                    <Card color="secondary" class="w-64 shadow-lg">
                      <CardBody>
                        {#if assignedPet}
                          <Stack gap={2}>
                            <Text class="font-medium">{assignedPet.name}</Text>
                            <Text size="small" color="secondary"
                              >{assignedPet.animal} · {assignedPet.breed} · {AssetTypeAgeNames[
                                assignedPet.age as AssetTypeAge
                              ]}</Text
                            >
                            <Button
                              size="small"
                              variant="outline"
                              color="danger"
                              class="w-full"
                              onclick={() => squareEditor?.assignActivePet(undefined)}>Unassign</Button
                            >
                          </Stack>
                        {:else}
                          <Stack gap={2}>
                            <Field label="Name">
                              <Input
                                placeholder=""
                                onchange={(e) =>
                                  petsUploaderManager.updateSelectedMetadata(
                                    'name',
                                    (e?.target as HTMLInputElement).value,
                                  )}
                                bind:value={petsUploaderManager.selectedMetadata.name}
                              />
                            </Field>
                            <Field label="Age">
                              <Select
                                onChange={(e) => petsUploaderManager.updateSelectedMetadata('age', e)}
                                options={Object.entries(AssetTypeAgeNames).map(([value, label]) => ({
                                  value: value as AssetTypeAge,
                                  label,
                                }))}
                                bind:value={selectedAssetTypeAge}
                              />
                            </Field>
                            <Field label="Animal">
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
                            <Field label="Breed" disabled={!selectedAssetTypeAnimal}>
                              <Select
                                onChange={(e) => petsUploaderManager.updateSelectedMetadata('breed', e)}
                                options={(selectedAssetTypeAnimal
                                  ? AssetTypeBreedNames[selectedAssetTypeAnimal]
                                  : []
                                ).map((breed) => ({
                                  value: breed,
                                  label: breed,
                                }))}
                                bind:value={petsUploaderManager.selectedMetadata.breed}
                              />
                            </Field>
                            <Button
                              size="small"
                              leadingIcon={mdiPlus}
                              class="w-full"
                              aria-label="Create Pet"
                              disabled={!buttonEnable}
                              onclick={() => {
                                const pet = petsUploaderManager.createPet({
                                  name: petsUploaderManager.selectedMetadata.name ?? '',
                                  age: petsUploaderManager.selectedMetadata.age ?? '',
                                  animal: petsUploaderManager.selectedMetadata.animal ?? '',
                                  breed: petsUploaderManager.selectedMetadata.breed ?? '',
                                });
                                squareEditor?.assignActivePet(pet.id);
                              }}>Create Pet</Button
                            >
                          </Stack>
                        {/if}
                      </CardBody>
                    </Card>
                  {/snippet}
                </SquareEditor>
                <div class="absolute top-2 right-2 z-10">
                  <IconButton
                    icon={panEnabled ? mdiLockOpenVariant : mdiLock}
                    size="small"
                    color={panEnabled ? 'secondary' : 'danger'}
                    aria-label={panEnabled ? 'Switch to draw mode' : 'Switch to pan mode'}
                    onclick={() => (panEnabled = !panEnabled)}
                  />
                </div>
              {:else}
                <div class="flex-flex col items-center gap-2 p-8 text-center">
                  <Icon icon={mdiCameraOff} class="size-8" />
                  <Text>No Image Selected</Text>
                </div>
              {/if}
            </div>

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
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap={2}>
            {#each petsUploaderManager.pets as pet (pet.id)}
              <div
                data-square-control
                class="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-primary/10"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left"
                  aria-label="Assign pet to selected box"
                  onclick={() => {
                    petsUploaderManager.applyPet(pet);
                    squareEditor?.assignActivePet(pet.id);
                  }}
                >
                  <Text class="truncate font-medium">{pet.name || 'Unnamed pet'}</Text>
                  <Text size="small" color="secondary" class="truncate"
                    >{pet.animal} · {pet.breed} · {AssetTypeAgeNames[pet.age as AssetTypeAge]}</Text
                  >
                </button>
                <IconButton
                  size="small"
                  variant="ghost"
                  color="danger"
                  shape="round"
                  icon={mdiTrashCanOutline}
                  aria-label="Delete pet"
                  onclick={() => petsUploaderManager.deletePet(pet.id)}
                />
              </div>
            {:else}
              <Text size="small" color="secondary">No pets yet. Select a box and create one.</Text>
            {/each}
          </Stack>
        </CardBody>
      </Card>
    </div>
  </section>
{/if}
