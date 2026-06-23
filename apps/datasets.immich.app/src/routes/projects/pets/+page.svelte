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
    mdiClose,
    mdiCloudUpload,
    mdiImageRemove,
    mdiPencilOutline,
    mdiPlus,
    mdiTrashCanOutline,
    mdiVectorSquare,
    mdiVectorSquareRemove,
  } from '@mdi/js';
  import { fade } from 'svelte/transition';

  type PetDraft = {
    name?: string;
    animal?: AssetTypeAnimal;
    breed?: string;
    birthMonth?: number;
    birthYear?: number;
  };

  let makePet = $state(false);
  let editPet = $state(false);
  let editingPetId = $state<string | undefined>(undefined);
  let petDraft = $state<PetDraft>({});
  const currentYear = new Date().getFullYear();

  const blankOption = { value: '', label: '-' };
  const monthOptions: { value: string; label: string }[] = [blankOption];
  for (let month = 1; month <= 12; month++) {
    monthOptions.push({ value: String(month), label: monthNames[month - 1] });
  }
  const yearOptions: { value: string; label: string }[] = [blankOption];
  for (let year = currentYear; year > currentYear - 60; year--) {
    yearOptions.push({ value: String(year), label: String(year) });
  }
  let petCount = $state(0);
  let petAsset = $derived(petsUploaderManager.assets[petCount]);
  let imagePets = $derived(
    petsUploaderManager.pets.filter((pet) => petAsset?.boxes.some((box) => box.petId === pet.id)),
  );
  let squareEditor = $state<{
    addSquare: () => void;
    deleteSquare: () => void;
    deselector: () => void;
    assignActivePet: (petId: string | undefined) => void;
    refresh: () => void;
  }>();
  let petImageUrl = $derived(petAsset ? URL.createObjectURL(petAsset.preview) : '');
  let activeSquare = $state(false);
  let activePetId = $state<string | undefined>(undefined);
  let addBlocked = $derived(activeSquare && activePetId == null);

  let buttonEnable = $derived(petDraft.animal && petDraft.breed);

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

{#if makePet || editPet}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    transition:fade|global={{ duration: 150 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        makePet = false;
        editPet = false;
        editingPetId = undefined;
      }
    }}
  >
    <Card color="secondary" class="w-full max-w-lg">
      <CardHeader>
        <div class="flex justify-between">
          <CardTitle>{editPet ? 'Edit Pet' : 'Create Pet'}</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Field label="Name">
          <Input class="transition-none" placeholder="" bind:value={petDraft.name} />
        </Field>
        <div class="grid grid-cols-2 gap-2">
          <Field label="Birth month">
            <Select
              value={petDraft.birthMonth?.toString()}
              onChange={(e) => (petDraft.birthMonth = e ? Number(e) : undefined)}
              options={monthOptions}
            />
          </Field>

          <Field label="Birth year">
            <Select
              value={petDraft.birthYear?.toString()}
              onChange={(e) => (petDraft.birthYear = e ? Number(e) : undefined)}
              options={yearOptions}
            />
          </Field>
        </div>
        <Field label="Animal" required="indicator">
          <Select
            onChange={(e) => {
              petDraft.animal = (e || undefined) as AssetTypeAnimal | undefined;
              petDraft.breed = undefined;
            }}
            options={[
              blankOption,
              ...Object.entries(AssetTypeAnimalNames).map(([value, label]) => ({
                value: value as AssetTypeAnimal,
                label,
              })),
            ]}
            bind:value={petDraft.animal}
          />
        </Field>
        <Field label="Breed" required="indicator" disabled={!petDraft.animal}>
          <Select
            onChange={(e) => (petDraft.breed = e || undefined)}
            options={[
              blankOption,
              ...(petDraft.animal ? AssetTypeBreedNames[petDraft.animal] : []).map((breed) => ({
                value: breed,
                label: breed,
              })),
            ]}
            bind:value={petDraft.breed}
          />
        </Field>
      </CardBody>
      <CardFooter class="gap-2">
        {#if makePet}
          <Button
            color="primary"
            leadingIcon={mdiPlus}
            aria-label="Create Pet"
            disabled={!buttonEnable}
            size="small"
            onclick={() => {
              const pet = petsUploaderManager.createPet({
                name: petDraft.name ?? '',
                birthMonth: petDraft.birthMonth ?? 0,
                birthYear: petDraft.birthYear ?? 0,
                animal: petDraft.animal ?? '',
                breed: petDraft.breed ?? '',
              });
              squareEditor?.assignActivePet(pet.id);
              makePet = false;
            }}>Create Pet</Button
          >
          <Button
            leadingIcon={mdiClose}
            size="small"
            color="danger"
            variant="outline"
            aria-label="Cancel Pet"
            onclick={() => {
              makePet = false;
            }}
            >Cancel
          </Button>
        {/if}
        {#if editPet}
          <Button
            color="primary"
            leadingIcon={mdiCheck}
            aria-label="Confirm Edits"
            size="small"
            disabled={!buttonEnable}
            onclick={() => {
              if (editingPetId) {
                petsUploaderManager.editPet(editingPetId, {
                  name: petDraft.name ?? '',
                  birthMonth: petDraft.birthMonth ?? 0,
                  birthYear: petDraft.birthYear ?? 0,
                  animal: petDraft.animal ?? '',
                  breed: petDraft.breed ?? '',
                });
              }
              editPet = false;
              editingPetId = undefined;
            }}>Confirm Edits</Button
          >
          <Button
            leadingIcon={mdiClose}
            size="small"
            color="danger"
            variant="outline"
            aria-label="Cancel Edit"
            onclick={() => {
              editPet = false;
            }}
            >Cancel
          </Button>
        {/if}
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
    <div class="my-4 grid grid-cols-1 gap-4 px-4 lg:grid-cols-[1fr_auto]">
      <Card color="secondary">
        <CardBody>
          <Stack>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="relative flex items-center justify-center overflow-hidden bg-neutral-900/10 p-4"
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
                      {#if !assignedPet}
                        <CardHeader>
                          <Text class="font-small self-center">Select a pet to tag</Text>
                        </CardHeader>
                      {/if}
                      <CardBody>
                        {#if assignedPet}
                          <Stack gap={2}>
                            <Text class="font-medium">{assignedPet.name || 'Unnamed Pet'}</Text>
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
                            <Button
                              size="small"
                              leadingIcon={mdiPlus}
                              class="w-full"
                              onclick={() => {
                                petDraft = {};
                                makePet = true;
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
              {:else}
                <div class="flex-flex col items-center gap-2 p-8 text-center">
                  <Icon icon={mdiCameraOff} class="size-8" />
                  <Text>No Image Selected</Text>
                </div>
              {/if}
            </div>

            <div
              class="flex gap-2 overflow-x-scroll pb-2 select-none"
              onwheel={(event) => {
                if (event.deltaY === 0) {
                  return;
                }
                event.preventDefault();
                event.currentTarget.scrollLeft += event.deltaY;
              }}
            >
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
                  {#if i === petCount}
                    <IconButton
                      size="tiny"
                      color="danger"
                      class="absolute inset-0.5 z-1"
                      icon={mdiImageRemove}
                      aria-label="Delete Photo"
                      onclick={() => {
                        petsUploaderManager.deselectAll();
                        petsUploaderManager.toggleSelect(petAsset);
                        petsUploaderManager.deleteSelected();
                      }}
                    />
                  {/if}
                  <img
                    src={URL.createObjectURL(asset.preview)}
                    alt={asset.name}
                    class="relative size-20 rounded-sm object-cover"
                    loading="eager"
                    draggable="false"
                    onerror={() => {
                      toastManager.danger(`This file couldn't be displayed and was removed.`);
                      petsUploaderManager.deleteById(asset.metadata.assetId!);
                    }}
                  />
                  {#if asset.boxes.length > 0}
                    <div class="light absolute inset-e-1 top-0.5 rounded-sm bg-success p-0.5">
                      <Icon icon={mdiCheck} class="size-3 text-light" />
                    </div>
                  {/if}
                </button>
              {/each}
              <IconButton
                onclick={() => petsUploaderManager.openFilePicker()}
                icon={mdiPlus}
                class="relative size-20 shrink-0 rounded-sm"
                variant="outline"
                aria-label="Add Images"
              />
            </div>
          </Stack>
        </CardBody>
      </Card>
      <div class="flex h-fit w-2xs flex-col gap-2">
        <Card color="secondary">
          <CardHeader>
            <CardTitle>Pets</CardTitle>
          </CardHeader>
          <CardBody>
            <Stack gap={2}>
              {#each imagePets as pet (pet.id)}
                <div data-square-control class="rounded-lg border-4 p-2 hover:bg-primary/10">
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
                  <div class="mt-2 flex items-center gap-1">
                    <IconButton
                      class="ml-auto"
                      size="small"
                      variant="ghost"
                      icon={mdiVectorSquare}
                      disabled={addBlocked}
                      aria-label="Add Square For Pet"
                      onclick={() => addSquareForPet(pet)}
                    />
                    <IconButton
                      size="small"
                      variant="ghost"
                      icon={mdiPencilOutline}
                      disabled={addBlocked}
                      aria-label="Edit Pet"
                      onclick={() => {
                        editingPetId = pet.id;
                        petDraft = {
                          name: pet.name,
                          animal: pet.animal as AssetTypeAnimal,
                          breed: pet.breed,
                          birthMonth: pet.birthMonth,
                          birthYear: pet.birthYear,
                        };
                        editPet = true;
                      }}
                    />
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
                <Text size="small" color="secondary">No pets yet. Add a box and create one.</Text>
              {/each}
              <Button
                leadingIcon={mdiVectorSquare}
                size="small"
                variant="outline"
                disabled={addBlocked}
                aria-label="Add Box"
                onclick={createSquare}
                >Add Box
              </Button>
            </Stack>
          </CardBody>
        </Card>
        <Button
          color="primary"
          size="small"
          class="light w-full whitespace-nowrap"
          leadingIcon={mdiCheck}
          disabled={petsUploaderManager.pets.length <= 0}
          onclick={() => {
            const warning = petsUploaderManager.submitWarning();
            if (warning) {
              toastManager.show({ title: 'Warning', description: warning, color: 'warning' });
              return;
            }
            doUpload();
          }}
        >
          Submit {petsUploaderManager.taggedAssetCount} photo(s)
        </Button>
      </div>
    </div>
  </section>
{/if}
