<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import SquareEditor from '$lib/components/SquareEditor.svelte';
  import UploadErrorModal from '$lib/components/UploadErrorModal.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import {
    type AssetTypeAnimal,
    AssetTypeAnimalNames,
    AssetTypeBreedNames,
    formatAge,
    monthNames,
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
    mdiPlus,
    mdiTrashCanOutline,
    mdiVectorSquare,
    mdiVectorSquareRemove,
  } from '@mdi/js';

  let selectedAssetTypeAnimal = $derived(petsUploaderManager.selectedMetadata.animal);
  const currentYear = new Date().getFullYear();

  const monthOptions: { value: string; label: string }[] = [];
  for (let month = 1; month <= 12; month++) {
    monthOptions.push({ value: String(month), label: monthNames[month - 1] });
  }
  const yearOptions: { value: string; label: string }[] = [];
  for (let year = currentYear; year > currentYear - 60; year--) {
    yearOptions.push({ value: String(year), label: String(year) });
  }
  let petCount = $state(0);
  let petAsset = $derived(petsUploaderManager.assets[petCount]);
  let squareEditor = $state<{
    addSquare: () => void;
    deleteSquare: () => void;
    deselector: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    assignActivePet: (petId: string | undefined) => void;
    refresh: () => void;
  }>();
  let petImageUrl = $derived(petAsset ? URL.createObjectURL(petAsset.preview) : '');
  let activeSquare = $state(false);
  let activePetId = $state<string | undefined>(undefined);
  let addBlocked = $derived(activeSquare && activePetId == null);

  let buttonEnable = $derived(
    petsUploaderManager.selectedMetadata.name &&
      petsUploaderManager.selectedMetadata.animal &&
      petsUploaderManager.selectedMetadata.birthMonth != null &&
      petsUploaderManager.selectedMetadata.birthYear != null &&
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

  const addSquareForPet = (pet: (typeof petsUploaderManager.pets)[number]) => {
    const asset = petsUploaderManager.assets[petCount];
    if (asset) {
      petsUploaderManager.deselectAll();
      petsUploaderManager.toggleSelect(asset);
    }
    squareEditor?.addSquare();
    petsUploaderManager.applyPet(pet);
    squareEditor?.assignActivePet(pet.id);
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
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'a', meta: true }, onShortcut: () => petsUploaderManager.selectAll() },
    { shortcut: { key: 'a', ctrl: true }, onShortcut: () => petsUploaderManager.selectAll() },
    { shortcut: { key: 'Escape' }, onShortcut: () => petsUploaderManager.deselectAll() },
  ]}
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
    <div class="my-4 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr_minmax(280px,320px)]">
      <Card color="secondary" class="h-fit lg:w-fit">
        <CardBody>
          <Stack gap={3}>
            <Button
              onclick={() => petsUploaderManager.openFilePicker()}
              leadingIcon={mdiPlus}
              size="small"
              variant="outline"
              aria-label="Add Images"
              >Add Images
            </Button>
            <Button
              leadingIcon={mdiVectorSquare}
              size="small"
              variant="outline"
              disabled={addBlocked}
              aria-label="Add Box"
              onclick={createSquare}
              >Add Box
            </Button>
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
          <Stack>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="relative flex min-h-[60dvh] items-center justify-center overflow-hidden bg-neutral-900/10"
              onpointerdown={(e) => {
                const t = e.target as HTMLElement;
                if (!t.closest('canvas, button, input, select, textarea, a, [data-square-control]')) {
                  squareEditor?.deselector();
                }
              }}
            >
              {#if petAsset}
                <SquareEditor
                  bind:this={squareEditor}
                  src={petImageUrl}
                  alt={petAsset.name}
                  boxes={petAsset.boxes}
                  bind:panEnabled
                  bind:zoom={petAsset.zoom}
                  onChange={(boxes) => petsUploaderManager.setBoxes(petAsset.metadata.assetId, boxes)}
                  onActiveChange={(active, petId) => {
                    activeSquare = active;
                    activePetId = petId;
                    if (active && petAsset) {
                      petsUploaderManager.deselectAll();
                      petsUploaderManager.toggleSelect(petAsset);
                      if (petId == null) {
                        petsUploaderManager.clearLabels();
                      }
                    } else {
                      petsUploaderManager.relabelFromBoxes();
                    }
                  }}
                >
                  {#snippet follow(box)}
                    {@const assignedPet = petsUploaderManager.getPet(box.petId)}
                    <Card color="primary" class="pointer-events-auto w-64 scale-80 shadow-lg">
                      <CardBody>
                        {#if assignedPet}
                          <Stack gap={2}>
                            <Text class="font-medium">{assignedPet.name}</Text>
                            <Text size="small" color="secondary"
                              >{assignedPet.animal}, {assignedPet.breed}, {formatAge(
                                assignedPet.birthMonth,
                                assignedPet.birthYear,
                              )}</Text
                            >
                            <Button
                              size="small"
                              variant="outline"
                              color="danger"
                              leadingIcon={mdiVectorSquareRemove}
                              class="w-full"
                              onclick={() => {
                                squareEditor?.deleteSquare();
                                petsUploaderManager.removeEmptyPets();
                                petsUploaderManager.relabelFromBoxes();
                              }}>Delete</Button
                            >
                          </Stack>
                        {:else}
                          <Stack gap={2}>
                            <Field label="Name">
                              <Input
                                class="transition-none"
                                placeholder=""
                                onchange={(e) =>
                                  petsUploaderManager.updateSelectedMetadata(
                                    'name',
                                    (e?.target as HTMLInputElement).value,
                                  )}
                                bind:value={petsUploaderManager.selectedMetadata.name}
                              />
                            </Field>
                            <div class="grid grid-cols-2 gap-2">
                              <Field label="Birth month">
                                <Select
                                  value={petsUploaderManager.selectedMetadata.birthMonth?.toString()}
                                  onChange={(e) =>
                                    petsUploaderManager.updateSelectedMetadata('birthMonth', e ? Number(e) : undefined)}
                                  options={monthOptions}
                                />
                              </Field>

                              <Field label="Birth year">
                                <Select
                                  value={petsUploaderManager.selectedMetadata.birthYear?.toString()}
                                  onChange={(e) =>
                                    petsUploaderManager.updateSelectedMetadata('birthYear', e ? Number(e) : undefined)}
                                  options={yearOptions}
                                />
                              </Field>
                            </div>
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
                                  birthMonth: petsUploaderManager.selectedMetadata.birthMonth ?? 0,
                                  birthYear: petsUploaderManager.selectedMetadata.birthYear ?? 0,
                                  animal: petsUploaderManager.selectedMetadata.animal ?? '',
                                  breed: petsUploaderManager.selectedMetadata.breed ?? '',
                                });
                                squareEditor?.assignActivePet(pet.id);
                              }}>Create Pet</Button
                            >
                            <Button
                              leadingIcon={mdiVectorSquareRemove}
                              size="small"
                              color="danger"
                              variant="outline"
                              aria-label="Delete Square"
                              onclick={() => {
                                squareEditor?.deleteSquare();
                                petsUploaderManager.removeEmptyPets();
                                petsUploaderManager.relabelFromBoxes();
                              }}
                              >Cancel
                            </Button>
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
                    variant="ghost"
                    color={panEnabled ? 'secondary' : 'danger'}
                    aria-label={panEnabled ? 'Switch to drag mode' : 'Switch to pan mode'}
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
          </Stack>
        </CardBody>
      </Card>
      <div class="flex h-fit flex-col gap-3">
        <Card color="secondary">
          <CardHeader>
            <CardTitle>Pets</CardTitle>
          </CardHeader>
          <CardBody>
            <Stack gap={2}>
              {#each petsUploaderManager.pets as pet (pet.id)}
                <div data-square-control class="rounded-lg p-2 hover:bg-primary/10">
                  <button
                    type="button"
                    class="w-full min-w-0 text-left"
                    aria-label="Assign pet to selected box"
                    onclick={() => {
                      petsUploaderManager.applyPet(pet);
                      squareEditor?.assignActivePet(pet.id);
                    }}
                  >
                    <Text class="truncate font-medium">{pet.name || 'Unnamed pet'}</Text>
                    <Text size="small" color="secondary" class="truncate"
                      >{pet.animal}, {pet.breed}, {formatAge(pet.birthMonth, pet.birthYear)}</Text
                    >
                  </button>
                  <div class="mt-2 flex items-center gap-2">
                    <Button
                      size="small"
                      variant="outline"
                      leadingIcon={mdiVectorSquare}
                      class="flex-1"
                      disabled={addBlocked}
                      aria-label="Add square for pet"
                      onclick={() => addSquareForPet(pet)}>Add square</Button
                    >
                    <IconButton
                      size="small"
                      variant="ghost"
                      color="danger"
                      shape="round"
                      icon={mdiTrashCanOutline}
                      aria-label="Delete pet"
                      onclick={() => {
                        petsUploaderManager.deletePet(pet.id);
                        squareEditor?.refresh();
                      }}
                    />
                  </div>
                </div>
              {:else}
                <Text size="small" color="secondary">No pets yet. Select a box and create one.</Text>
              {/each}
            </Stack>
          </CardBody>
        </Card>
        <Button
          color="primary"
          size="small"
          class="light w-full whitespace-nowrap"
          leadingIcon={mdiCheck}
          onclick={() => {
            const warning = petsUploaderManager.submitWarning();
            if (warning) {
              toastManager.show({ title: 'Warning', description: warning, color: 'warning' });
              return;
            }
            doUpload();
          }}
        >
          Submit {petsUploaderManager.assets.length} photo(s)
        </Button>
      </div>
    </div>
  </section>
{/if}
