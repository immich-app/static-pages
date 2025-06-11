import EXIFReader from 'exifreader';
import type { ExifDatasetMetadata } from '../../../types/metadata';
import { mdiAccount, mdiCameraBurst, mdiImage, mdiPanoramaVariant, mdiPencil, mdiSphere } from '@mdi/js';

export type AssetType = ExifDatasetMetadata['captureType'];
export const AssetTypeNames: Record<AssetType, string> = {
  single: 'Single',
  burst: 'Burst',
  portrait: 'Portrait',
  panorama: 'Panorama',
  spherical: 'Spherical',
  other: 'Other',
};

export const AssetTypeIcons: Record<AssetType, string> = {
  single: mdiImage,
  burst: mdiCameraBurst,
  portrait: mdiAccount,
  panorama: mdiPanoramaVariant,
  spherical: mdiSphere,
  other: mdiPencil,
};

interface EXIFAsset {
  data: File;
  name: string;
  metadata: Partial<ExifDatasetMetadata>;
  id: string;
  selected: boolean;
}

class ExifUploaderManager {
  assets = $state<EXIFAsset[]>([]);
  selection = $derived(this.assets.filter((a) => a.selected));

  // Metadata for the selected assets
  selectedMetadata = $state<Partial<EXIFAsset['metadata']>>({});
  submitDisabled = $state(true);

  constructor() {
    this.assets = [];
  }

  async addAsset(asset: File) {
    let tags: EXIFReader.Tags;

    try {
      tags = await EXIFReader.load(asset, { async: true });
    } catch {
      // it was an invalid image format so we skip it
      return;
    }

    const newAsset: EXIFAsset = {
      data: asset,
      name: asset.name,
      id: crypto.randomUUID(),
      metadata: {
        cameraMake: tags['Make']?.description,
        cameraModel: tags['Model']?.description,
      },
      selected: false,
    };

    this.assets.push(newAsset);
    this.updateMetadataInputs();
  }

  private updateMetadataInputs() {
    if (this.selection.length === 0) {
      this.selectedMetadata = {};
    } else {
      const metadataKeys = Object.keys(this.selection[0].metadata) as (keyof EXIFAsset['metadata'])[];

      for (const key of metadataKeys) {
        const allSame = this.selection.every((a) => a.metadata[key] === this.selection[0].metadata[key]);

        if (key === 'captureType') {
          this.selectedMetadata[key] = allSame ? this.selection[0].metadata[key] : undefined;
        } else {
          this.selectedMetadata[key] = allSame ? this.selection[0].metadata[key] : '';
        }
      }
    }
  }

  toggleSelect(asset: EXIFAsset) {
    asset.selected = !asset.selected;
    this.updateMetadataInputs();
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

  deleteSelected() {
    this.assets = this.assets.filter((asset) => !asset.selected);
    this.updateMetadataInputs();
    this.validateUploads();
  }

  updateSelectedMetadata<K extends keyof EXIFAsset['metadata']>(metadataKey: K, value: EXIFAsset['metadata'][K]) {
    for (const asset of this.selection) {
      // empy string values should be set to undefined
      if (typeof value === 'string' && value.trim() === '') {
        asset.metadata[metadataKey] = undefined;
        continue;
      }

      asset.metadata[metadataKey] = value;
    }

    this.updateMetadataInputs();
    this.validateUploads();
  }

  // this can't be a derived because svelte only detects changes
  // to the assets array, not the contents of the objects inside it
  validateUploads() {
    if (this.assets.length === 0) {
      this.submitDisabled = true;
      return;
    }

    // check if any required metadata fields are empty
    const requiredFields: (keyof EXIFAsset['metadata'])[] = ['cameraMake', 'cameraModel', 'captureType'];
    this.submitDisabled = this.assets.some((asset) => {
      return requiredFields.some((field) => {
        const value = asset.metadata[field];
        return value === undefined;
      });
    });
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*';
    input.multiple = true;

    input.onchange = async () => {
      if (input.files) {
        for (const file of Array.from(input.files)) {
          await this.addAsset(file);
        }
      }
    };

    input.click();
  }
}

// Persist EXIFUploaderManager instance across HMRs
let exifUploaderManager: ExifUploaderManager;

if (import.meta.hot) {
  if (!import.meta.hot.data.exifUploaderManager) {
    import.meta.hot.data.exifUploaderManager = new ExifUploaderManager();
  }
  exifUploaderManager = import.meta.hot.data.exifUploaderManager;
} else {
  exifUploaderManager = new ExifUploaderManager();
}

export { exifUploaderManager };
