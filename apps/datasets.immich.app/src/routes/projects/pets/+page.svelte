<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DragAndDropUpload from '$lib/components/DragAndDropUpload.svelte';
  import SquareEditor from '$lib/components/SquareEditor.svelte';
  import UploadErrorModal from '$lib/components/UploadErrorModal.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import {
    animalLabel,
    type AssetTypeAnimal,
    AssetTypeAnimalNames,
    AssetTypeBreedNames,
    boxFill,
    formatAge,
    monthNames,
    petsUploaderManager,
  } from '$lib/pets-uploader-manager.svelte';
  import {
    Badge,
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
    Logo,
    Modal,
    ModalBody,
    ModalFooter,
    modalManager,
    Select,
    Stack,
    Text,
    toastManager,
  } from '@immich/ui';
  import {
    mdiCameraOff,
    mdiCheck,
    mdiCheckBold,
    mdiClose,
    mdiCloudUpload,
    mdiPencilOutline,
    mdiPlus,
    mdiTrashCan,
    mdiTrashCanOutline,
    mdiVectorSquare,
    mdiVectorSquareRemove,
    mdiWindowClose,
  } from '@mdi/js';
  import { fade } from 'svelte/transition';

  type PetDraft = {
    name?: string;
    animal?: AssetTypeAnimal;
    breed?: string;
    birthMonth?: number;
    birthYear?: number;
  };
  let displayInstructions = $state(true);
  let makePet = $state(false);
  let editPet = $state(false);
  let editingPetId = $state<string | undefined>(undefined);
  let petDraft = $state<PetDraft>({});
  let otherAnimal = $state('');
  let otherBreed = $state('');
  const currentYear = new Date().getFullYear();

  const blankOption = { value: '', label: '-' };
  const monthOptions: { value: string; label: string }[] = [blankOption];
  for (let month = 1; month <= 12; month++) {
    monthOptions.push({ value: String(month), label: monthNames[month - 1] });
  }
  const yearOptions: { value: string; label: string }[] = [blankOption];
  for (let year = currentYear; year > currentYear - 80; year--) {
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

  let finalAnimal = $derived(petDraft.animal === 'Other' ? otherAnimal : (petDraft.animal ?? ''));
  let finalBreed = $derived(petDraft.breed === 'Other' ? otherBreed : (petDraft.breed ?? ''));
  let buttonEnable = $derived(finalAnimal && finalBreed);

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
        <div class="flex items-center gap-1">
          <Logo variant="icon" size="tiny" />
          <CardTitle>{editPet ? 'Edit Pet' : 'Create Pet'}</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <Field label="Name">
          <Input bind:value={petDraft.name} maxlength={30} />
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
            bind:value={petDraft.animal}
            onChange={() => (petDraft.breed = undefined)}
            options={[blankOption, ...Object.entries(AssetTypeAnimalNames).map(([value, label]) => ({ value, label }))]}
          />
          {#if petDraft.animal === 'Other'}
            <Input bind:value={otherAnimal} placeholder="Enter animal" class="w-fit" maxlength={30} />
          {/if}
        </Field>
        <Field label="Breed" required="indicator" disabled={!petDraft.animal}>
          <Select
            bind:value={petDraft.breed}
            options={[
              blankOption,
              ...(petDraft.animal ? AssetTypeBreedNames[petDraft.animal] : []).map((breed) => ({
                value: breed,
                label: breed,
              })),
            ]}
          />
          {#if petDraft.breed === 'Other'}
            <Input bind:value={otherBreed} placeholder="Enter breed" class="w-fit" maxlength={30} />
          {/if}
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
                birthMonth: petDraft.birthMonth,
                birthYear: petDraft.birthYear,
                animal: finalAnimal,
                breed: finalBreed,
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
                  birthMonth: petDraft.birthMonth,
                  birthYear: petDraft.birthYear,
                  animal: finalAnimal,
                  breed: finalBreed,
                });
                squareEditor?.refresh();
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
  {#if displayInstructions}
    <Modal title="Instructions" onClose={() => (displayInstructions = false)}>
      <ModalBody>
        <div class="flex list-decimal flex-col gap-2 px-8">
          <li>Drag photos anywhere onto the page, or press the + button on the carousel to add them.</li>
          <li>
            Click a photo and add a box around the faces of your pets using the "Add Box" button. Drag the corners so
            the box fits the face.
            <img
              src="/img/petface-example.png"
              alt="Example of a box drawn around a pet's face"
              class="mx-auto mt-2 w-64 rounded-lg"
              draggable="false"
            />
          </li>
          <li>If creating a new pet, choose a name, animal, breed and birthday, then select "Create Pet".</li>
          <li>Add at least 1 pet per image and 10 images per pet, then submit your photos.</li>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button shape="round" onclick={() => (displayInstructions = false)}>Ok</Button>
      </ModalFooter>
    </Modal>
  {/if}
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
                  colorForPet={(petId) => petsUploaderManager.colorForPet(petId)}
                  onChange={(boxes) => petsUploaderManager.setBoxes(petAsset.metadata.assetId, boxes)}
                  onActiveChange={(active, petId) => {
                    activeSquare = active;
                    activePetId = petId;
                    if (active && petAsset) {
                      petsUploaderManager.deselectAll();
                      petsUploaderManager.toggleSelect(petAsset);
                    }
                  }}
                >
                  {#snippet follow(box)}
                    {@const assignedPet = petsUploaderManager.getPet(box.petId)}
                    <Card color="primary" class="pointer-events-auto w-64 scale-80 shadow-lg">
                      <CardBody>
                        <Stack gap={2}>
                          {#if !assignedPet}
                            <div class="flex items-center justify-between">
                              <Text class="font-small">Select a pet to tag</Text>
                              <IconButton
                                icon={mdiWindowClose}
                                size="small"
                                color="secondary"
                                variant="ghost"
                                aria-label="Delete Square"
                                onclick={() => {
                                  squareEditor?.deleteSquare();
                                  petsUploaderManager.removeEmptyPets();
                                }}
                              />
                            </div>
                          {/if}
                          {#if assignedPet}
                            <Stack gap={2}>
                              <Text class="font-medium">{assignedPet.name || 'Unnamed Pet'}</Text>
                              <Text size="small" color="secondary"
                                >{animalLabel(assignedPet.animal)}, {assignedPet.breed}, {formatAge(
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
                                }}>Delete</Button
                              >
                            </Stack>
                          {:else}
                            <Stack gap={2}>
                              {#if petsUploaderManager.pets.length > 0}
                                <div class="max-h-40 overflow-y-auto rounded-lg border border-muted p-1.25">
                                  <Stack gap={2}>
                                    {#each petsUploaderManager.pets as pet (pet.id)}
                                      {@const petColor = petsUploaderManager.colorForPet(pet.id)}
                                      <button
                                        type="button"
                                        class="w-full rounded-lg border-2 border-(--pet-color)/25 bg-(--pet-color)/25 p-2 text-left transition-colors hover:bg-(--pet-color)/50"
                                        style="--pet-color: {petColor}"
                                        onclick={() => {
                                          squareEditor?.assignActivePet(pet.id);
                                        }}
                                      >
                                        <Text class="truncate font-medium">{pet.name || 'Unnamed pet'}</Text>
                                        <Text size="tiny" color="secondary" class="truncate">
                                          {animalLabel(pet.animal)}, {pet.breed}, {formatAge(
                                            pet.birthMonth,
                                            pet.birthYear,
                                          )}
                                        </Text>
                                      </button>
                                    {/each}
                                  </Stack>
                                </div>
                              {/if}
                              <Button
                                size="small"
                                leadingIcon={mdiPlus}
                                class="w-full"
                                onclick={() => {
                                  petDraft = {};
                                  otherAnimal = '';
                                  otherBreed = '';
                                  makePet = true;
                                }}
                                >New Pet
                              </Button>
                            </Stack>
                          {/if}
                        </Stack>
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
                  class="group relative shrink-0 rounded-lg border-3 {i === petCount
                    ? 'border-primary'
                    : 'dark:border-secondary'}"
                  onclick={() => {
                    if (i !== petCount) {
                      squareEditor?.deselector();
                      petCount = i;
                    }
                  }}
                >
                  <IconButton
                    color="danger"
                    class="absolute inset-x-0 bottom-1 z-2 mx-auto flex h-5 w-11 rounded-full opacity-0 transition-all group-hover:opacity-100"
                    icon={mdiTrashCan}
                    aria-label="Delete Photo"
                    onclick={async () => {
                      const hasPet = asset.boxes.some((box) => box.petId);
                      if (hasPet && !(await modalManager.showDialog({ prompt: 'Delete this photo?' }))) {
                        return;
                      }
                      petsUploaderManager.deleteById(asset.metadata.assetId!);
                    }}
                  />
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
                  {#if asset.boxes.some((box) => box.petId)}
                    <div
                      class="light absolute inset-x-0 top-0 mx-auto flex h-3 w-9 items-end justify-center rounded-b-full bg-success/90 pb-px"
                    >
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
      <div class="w-full lg:relative lg:w-3xs">
        <div class="flex flex-col gap-4 lg:absolute lg:inset-0">
          <Card color="secondary" class="min-h-0 flex-1">
            <CardBody class="min-h-0 p-4">
              <Text class="truncate pb-2 text-left font-bold" size="large">Pets</Text>
              <Stack gap={2}>
                {#each imagePets as pet (pet.id)}
                  {@const petColor = petsUploaderManager.colorForPet(pet.id)}
                  <div
                    data-square-control
                    class="rounded-lg border-4 p-2"
                    style="border-color: {boxFill(petColor, 0.25)}; background-color: {boxFill(petColor, 0.2)}"
                  >
                    <Text class="truncate text-left font-medium">{pet.name || 'Unnamed pet'}</Text>
                    <Text size="tiny" color="secondary" class="truncate"
                      >{animalLabel(pet.animal)}, {pet.breed}, {formatAge(pet.birthMonth, pet.birthYear)}</Text
                    >
                    <div class="mt-2 flex items-center gap-1">
                      <IconButton
                        size="small"
                        class=""
                        variant="ghost"
                        icon={mdiPencilOutline}
                        disabled={addBlocked}
                        aria-label="Edit Pet"
                        onclick={() => {
                          editingPetId = pet.id;
                          const knownAnimal = pet.animal in AssetTypeAnimalNames;
                          const knownBreed = knownAnimal && AssetTypeBreedNames[pet.animal].includes(pet.breed);
                          petDraft = {
                            name: pet.name,
                            animal: knownAnimal ? pet.animal : 'Other',
                            breed: knownBreed ? pet.breed : 'Other',
                            birthMonth: pet.birthMonth,
                            birthYear: pet.birthYear,
                          };
                          otherAnimal = knownAnimal ? '' : pet.animal;
                          otherBreed = knownBreed ? '' : pet.breed;
                          editPet = true;
                        }}
                      />
                      <IconButton
                        size="small"
                        variant="ghost"
                        class="mr-auto"
                        color="danger"
                        shape="round"
                        icon={mdiTrashCanOutline}
                        aria-label="Delete pet"
                        onclick={async () => {
                          if (await modalManager.showDialog({ prompt: 'Delete this Pet?' })) {
                            petsUploaderManager.deletePet(pet.id);
                            squareEditor?.refresh();
                          }
                        }}
                      />
                      <Badge size="small" color="primary">{petsUploaderManager.imageCountForPet(pet.id)}/10</Badge>
                    </div>
                  </div>
                {:else}
                  <Text size="tiny" color="secondary">No pets in this image yet. Add a box to create one.</Text>
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
          <Card color="secondary">
            <CardBody>
              <Stack gap={2}>
                <Text size="large" class="font-bold" color="secondary">Submission</Text>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <Icon
                      icon={petsUploaderManager.assets.length > 0 &&
                      petsUploaderManager.taggedAssetCount === petsUploaderManager.assets.length
                        ? mdiCheckBold
                        : mdiClose}
                    ></Icon>

                    <Text size="tiny" color="secondary">At least 1 pet per image</Text>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Icon
                    icon={petsUploaderManager.pets.length > 0 &&
                    petsUploaderManager.pets.every((p) => petsUploaderManager.imageCountForPet(p.id) >= 10)
                      ? mdiCheckBold
                      : mdiClose}
                  ></Icon>
                  <Text size="tiny" color="secondary">At least 10 images per pet</Text>
                </div>
                <Button
                  color="primary"
                  size="small"
                  class="light w-full whitespace-nowrap"
                  leadingIcon={mdiCheck}
                  disabled={!(
                    petsUploaderManager.assets.length > 0 &&
                    petsUploaderManager.taggedAssetCount === petsUploaderManager.assets.length &&
                    petsUploaderManager.pets.length > 0 &&
                    petsUploaderManager.pets.every((p) => petsUploaderManager.imageCountForPet(p.id) >= 10)
                  )}
                  onclick={() => doUpload()}
                >
                  Submit {petsUploaderManager.taggedAssetCount} photo(s)
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  </section>
{/if}
