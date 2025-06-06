import EXIFReader from 'exifreader';

export enum AssetType {
  Image = 'image',
  Burst = 'burst',
  PortraitMode = 'portrait_mode',
  Panorama = 'panorama',
}

export const AssetTypeNames: Record<AssetType, string> = {
  [AssetType.Image]: 'Image',
  [AssetType.Burst]: 'Burst',
  [AssetType.PortraitMode]: 'Portrait Mode',
  [AssetType.Panorama]: 'Panorama',
};

interface EXIFAsset {
  data: File;
  name: string;
  metadata: {
    type?: AssetType;
    cameraMfg: string;
    cameraModel: string;
  };
  id: string;
  selected: boolean;
}

class EXIFUploaderManager {
  assets = $state<EXIFAsset[]>([]);
  selection = $derived(this.assets.filter((a) => a.selected));

  // Metadata for the selected assets
  selectedMetadata = $state<EXIFAsset['metadata']>({
    cameraMfg: '',
    cameraModel: '',
  });

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
        cameraMfg: tags['Make']?.description ?? '',
        cameraModel: tags['Model']?.description ?? '',
      },
      selected: false,
    };

    this.assets.push(newAsset);
  }

  private updateMetadataInputs() {
    if (this.selection.length === 0) {
      this.selectedMetadata = {
        cameraMfg: '',
        cameraModel: '',
      };
    } else {
      const metadataKeys = Object.keys(this.selection[0].metadata) as (keyof EXIFAsset['metadata'])[];

      for (const key of metadataKeys) {
        const allSame = this.selection.every((a) => a.metadata[key] === this.selection[0].metadata[key]);

        if (key === 'type') {
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

  updateSelectedMetadata<K extends keyof EXIFAsset['metadata']>(metadataKey: K, value: EXIFAsset['metadata'][K]) {
    for (const asset of this.selection) {
      asset.metadata[metadataKey] = value;
    }

    this.updateMetadataInputs();
  }
}

// Persist EXIFUploaderManager instance across HMRs
let exifUploaderManager: EXIFUploaderManager;

if (import.meta.hot) {
  if (!import.meta.hot.data.exifUploaderManager) {
    import.meta.hot.data.exifUploaderManager = new EXIFUploaderManager();
  }
  exifUploaderManager = import.meta.hot.data.exifUploaderManager;
} else {
  exifUploaderManager = new EXIFUploaderManager();
}

export { exifUploaderManager };
