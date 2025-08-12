import { mdiAccount, mdiCameraBurst, mdiImage, mdiPanoramaVariant, mdiPencil, mdiSphere } from '@mdi/js';
import EXIFReader from 'exifreader';
import type { ExifDatasetMetadata } from '../../../types/metadata';
import type { UploadableAssets } from '../../../types/upload-manager';

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

export interface EXIFAsset {
  data: File;
  preview: Blob;
  name: string;
  metadata: Partial<ExifDatasetMetadata>;
  selected: boolean;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

class ExifUploaderManager implements UploadableAssets {
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

    if (asset.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    try {
      tags = await EXIFReader.load(asset, { async: true });
    } catch {
      throw new Error('Invalid Image file, please upload a valid image.');
    }

    const previewBlob = await this.generatePreview(asset);
    let preview: Blob;

    // if the preview generation failed, use the original file as the preview
    if (!previewBlob) {
      preview = asset;
    } else {
      preview = previewBlob;
    }

    const id = crypto.randomUUID();

    const newAsset: EXIFAsset = {
      data: asset,
      preview: preview,
      name: asset.name,
      metadata: {
        cameraMake: tags['Make']?.description,
        cameraModel: tags['Model']?.description,
        originalFilename: asset.name,
        assetId: id,
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
      const metadataKeys = Array.from(
        new Set(this.selection.flatMap((asset) => Object.keys(asset.metadata))),
      ) as (keyof EXIFAsset['metadata'])[];

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

  toggleSelect(asset: EXIFAsset, shiftHeld: boolean = false) {
    // check if shift key is held
    if (shiftHeld) {
      // find the index of the asset in the assets array
      const index = this.assets.indexOf(asset);
      if (index === -1) return;

      // find the last selected asset
      const lastSelectedIndex = this.assets.findIndex((a) => a.selected);
      if (lastSelectedIndex === -1) return;

      // select all assets between the last selected and the current asset
      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);

      for (let i = start; i <= end; i++) {
        this.assets[i].selected = true;
      }
    } else {
      asset.selected = !asset.selected;
    }

    this.updateMetadataInputs();
  }

  selectAll() {
    for (const asset of this.assets) {
      asset.selected = true;
    }

    this.updateMetadataInputs();
  }

  deselectAll() {
    for (const asset of this.assets) {
      asset.selected = false;
    }

    this.updateMetadataInputs();
  }

  deleteSelected() {
    this.assets = this.assets.filter((asset) => !asset.selected);
    this.updateMetadataInputs();
    this.validateUploads();
  }

  deleteById(assetId: string) {
    this.assets = this.assets.filter((asset) => asset.metadata.assetId !== assetId);
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

  // efficient image preview generation
  private async generatePreview(blob: Blob) {
    const imageBitmap = await createImageBitmap(blob, { resizeWidth: 800 });
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
