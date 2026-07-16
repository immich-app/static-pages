import { toastManager } from '@immich/ui';
import type {
  Asset,
  PetDatasetMetadata,
  Submission,
  PetBox as SubmissionBox,
  Pet as SubmissionPet,
} from '../../types/metadata';
import type { UploadableAssets } from '../../types/upload-manager';

export type Pet = {
  id: string;
  name: string;
  animal: string;
  breed: string;
  birthMonth?: number;
  birthYear?: number;
};

export type AssetTypeAnimal = string;
export const AssetTypeAnimalNames: Record<AssetTypeAnimal, string> = {
  Bird: 'Bird',
  Cat: 'Cat',
  Chinchilla: 'Chinchilla',
  Dog: 'Dog',
  Ferret: 'Ferret',
  GuineaPig: 'Guinea Pig',
  Hamster: 'Hamster',
  Hedgehog: 'Hedgehog',
  Pig: 'Pig',
  Rabbit: 'Rabbit',
  Other: 'Other',
};

export const AssetTypeBreedNames: Record<AssetTypeAnimal, string[]> = {
  Cat: ['Siamese', 'British Shorthair', 'Burmese', 'Maine Coon', 'Mixed Breed', 'Other'],
  Dog: [
    'Mixed Breed',
    'Chihuahua',
    'Toy Poodle',
    'Miniature Daschund',
    'Shiba Inu',
    'Pomeranian',
    'Shih Tzu',
    'Maltese',
    'Yorkshire Terrier',
    'French Bulldog',
    'Maltipoo',
    'Other',
    'Unknown',
  ],
  Rabbit: ['Netherland Dwarf', 'Lop Ear', 'Lion Rabbit', 'Mini Rabbit', 'Holland Lop', 'Mini Rex', 'Other', 'Unknown'],
  Pig: [
    'Pot-bellied',
    'Kunekune',
    'Juliana',
    'American Mini Pig',
    'Mini Pig',
    'Teacup',
    'Farm Pig',
    'Other',
    'Unknown',
  ],
  Bird: [
    'Parakeet',
    'Cockatiel',
    'Cockatoo',
    'Parrot',
    'Macaw',
    'African Grey',
    'Conure',
    'Lovebird',
    'Canary',
    'Finch',
    'Dove',
    'Pigeon',
    'Owl',
    'Other',
    'Unknown',
  ],
  Chinchilla: ['Standard Gray', 'White', 'Beige', 'Ebony', 'Violet', 'Black Velvet', 'Other', 'Unknown'],
  Ferret: ['Sable', 'Albino', 'Champagne', 'Cinnamon', 'Black Sable', 'Other', 'Unknown'],
  GuineaPig: ['American', 'Abyssinian', 'Peruvian', 'Teddy', 'Silkie', 'Other', 'Unknown'],
  Hamster: ['Syrian', 'Winter White Dwarf', 'Campbell Dwarf', 'Roborovski Dwarf', 'Chinese', 'Other', 'Unknown'],
  Hedgehog: ['African Pygmy', 'Algerian', 'Pinto', 'Snowflake', 'Albino', 'Other', 'Unknown'],
  Other: ['Other'],
};

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export const boxColors = [
  'rgb(66,80,175)',
  'rgb(229,57,53)',
  'rgb(67,160,71)',
  'rgb(251,140,0)',
  'rgb(142,36,170)',
  'rgb(0,172,193)',
  'rgb(216,27,96)',
  'rgb(109,76,65)',
];

export const boxFill = (color: string, alpha = 0.15) => color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);

export const animalLabel = (animal: string) => AssetTypeAnimalNames[animal as AssetTypeAnimal] ?? animal;

export const formatAge = (birthMonth?: number, birthYear?: number): string => {
  if (!birthMonth || !birthYear) {
    return 'Unknown age';
  }

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const now = new Date();
  const months = (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - birthMonth);
  if (months < 0) {
    return 'Not born yet';
  }

  return `${Math.floor(months / 12)} yr(s) ${months % 12} mo(s)`;
};

export type squareBox = { left: number; top: number; width: number; height: number; petId?: string };

export interface PetAsset {
  data: File;
  preview: Blob;
  name: string;
  metadata: Partial<PetDatasetMetadata>;
  selected: boolean;
  boxes: squareBox[];
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

class PetsUploaderManager implements UploadableAssets {
  assets = $state<PetAsset[]>([]);
  selection = $derived(this.assets.filter((a) => a.selected));

  taggedAssetCount = $derived(this.assets.filter((a) => a.boxes.some((box) => box.petId)).length);

  pets = $state<Pet[]>([]);
  readonly sessionId = crypto.randomUUID();

  constructor() {
    this.pets = JSON.parse(localStorage.getItem('pets') ?? '[]');
    globalThis.addEventListener('beforeunload', (event) => {
      localStorage.setItem('pets', JSON.stringify(this.pets));
      if (this.assets.length > 0) {
        event.preventDefault();
      }
    });
  }

  async addAsset(asset: File) {
    if (asset.size > MAX_FILE_SIZE) {
      toastManager.danger(`File "${asset.name}" exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB size limit.`);
      return;
    }

    let previewBlob: Blob | null = null;
    try {
      previewBlob = await this.generatePreview(asset);
    } catch (error) {
      console.error('Preview generation failed', error);
    }

    // if the preview generation failed, use the original file as the preview
    if (!previewBlob) {
      previewBlob = asset;
    }

    const id = crypto.randomUUID();
    const newAsset: PetAsset = {
      data: asset,
      preview: previewBlob,
      name: asset.name,
      metadata: {
        originalFilename: asset.name,
        assetId: id,
      },
      selected: false,
      boxes: [],
    };

    this.assets.push(newAsset);
  }

  toggleSelect(asset: PetAsset, shiftHeld: boolean = false) {
    if (shiftHeld) {
      const index = this.assets.indexOf(asset);
      if (index === -1) {
        return;
      }

      const lastSelectedIndex = this.assets.findIndex((a) => a.selected);
      if (lastSelectedIndex === -1) {
        return;
      }

      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);

      for (let i = start; i <= end; i++) {
        this.assets[i].selected = true;
      }
    } else {
      asset.selected = !asset.selected;
    }
  }

  selectAll() {
    for (const asset of this.assets) {
      asset.selected = true;
    }
  }

  deselectAll() {
    for (const asset of this.assets) {
      asset.selected = false;
    }
  }

  deleteById(assetId: string) {
    const asset = this.assets.find((a) => a.metadata.assetId === assetId);
    this.assets = this.assets.filter((a) => a.metadata.assetId !== assetId);
    if (asset?.boxes.some((box) => box.petId)) {
      this.removeEmptyPets();
    }
  }

  setBoxes(assetId: string | undefined, boxes: squareBox[]) {
    if (!assetId) {
      return;
    }
    const asset = this.assets.find((a) => a.metadata.assetId === assetId);
    if (asset) {
      asset.boxes = boxes;
    }
  }

  getPet(id?: string): Pet | undefined {
    return id ? this.pets.find((p) => p.id === id) : undefined;
  }

  createPet(data: Omit<Pet, 'id'>): Pet {
    const existing = this.findMatchingPet(data);
    if (existing) {
      return existing;
    }
    const pet: Pet = { id: crypto.randomUUID(), ...data };
    this.pets.push(pet);
    return this.pets.at(-1) ?? pet;
  }

  editPet(id: string, data: Omit<Pet, 'id'>): Pet | undefined {
    const existing = this.findMatchingPet(data);
    if (existing) {
      return existing;
    }
    const pet = this.pets.find((p) => p.id === id);
    if (!pet) {
      return undefined;
    }
    Object.assign(pet, data);
    return pet;
  }

  findMatchingPet(data: Omit<Pet, 'id'>): Pet | undefined {
    return this.pets.find(
      (p) =>
        p.name === data.name &&
        p.animal === data.animal &&
        p.breed === data.breed &&
        p.birthMonth === data.birthMonth &&
        p.birthYear === data.birthYear,
    );
  }

  deletePet(id: string) {
    this.pets = this.pets.filter((p) => p.id !== id);

    for (const asset of this.assets) {
      asset.boxes = asset.boxes.filter((box) => box.petId !== id);
    }
  }

  colorForPet(id: string): string {
    const index = this.pets.findIndex((p) => p.id === id);
    return boxColors[Math.max(0, index) % boxColors.length];
  }

  imageCountForPet(id: string): number {
    return this.assets.filter((asset) => asset.boxes.some((box) => box.petId === id)).length;
  }

  removeEmptyPets() {
    this.pets = this.pets.filter((p) => this.imageCountForPet(p.id) > 0);
  }

  toSubmission(email: string): Submission {
    const pets: SubmissionPet[] = this.pets.map((pet) => ({
      id: pet.id,
      name: pet.name,
      animal: pet.animal,
      breed: pet.breed,
      birthMonth: pet.birthMonth ? String(pet.birthMonth) : '',
      birthYear: pet.birthYear ? String(pet.birthYear) : '',
    }));

    const assets: Asset[] = this.assets.map((asset) => ({
      id: asset.metadata.assetId ?? '',
      originalFileName: asset.metadata.originalFilename ?? asset.name,
    }));

    const boxes: SubmissionBox[] = [];
    for (const asset of this.assets) {
      for (const box of asset.boxes) {
        if (!box.petId) {
          continue;
        }
        boxes.push({
          petId: box.petId,
          assetId: asset.metadata.assetId ?? '',
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        });
      }
    }

    return {
      user: { id: this.sessionId, email },
      pets,
      assets,
      boxes,
    };
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*';
    input.multiple = true;

    input.addEventListener('change', async () => {
      if (input.files) {
        for (const file of input.files) {
          await this.addAsset(file);
        }
      }
    });

    input.click();
  }

  // efficient image preview generation
  private async generatePreview(blob: Blob) {
    const imageBitmap = await createImageBitmap(blob, { resizeWidth: 1600 });
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.drawImage(imageBitmap, 0, 0);
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
  }
}

// Persist PETSUploaderManager instance across HMRs
let petsUploaderManager: PetsUploaderManager;

if (import.meta.hot) {
  if (!import.meta.hot.data.PetsUploaderManager) {
    import.meta.hot.data.PetsUploaderManager = new PetsUploaderManager();
  }
  petsUploaderManager = import.meta.hot.data.PetsUploaderManager;
} else {
  petsUploaderManager = new PetsUploaderManager();
}

export { petsUploaderManager };
