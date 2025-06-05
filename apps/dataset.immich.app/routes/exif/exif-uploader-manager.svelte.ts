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
    type: AssetType;
    cameraMfg: string;
    cameraModel: string;
  };
  id: string;
  selected: boolean;
}

class EXIFUploaderManager {
  assets = $state<EXIFAsset[]>([]);
  selection = $derived(this.assets.filter((a) => a.selected));

  constructor() {
    this.assets = [];
  }

  async addAsset(asset: File) {
    let tags: EXIFReader.Tags;

    try {
      tags = await EXIFReader.load(asset, { async: true });
    } catch {
      return;
    }

    const newAsset: EXIFAsset = {
      data: asset,
      name: asset.name,
      id: crypto.randomUUID(),
      metadata: {
        type: AssetType.Image,
        cameraMfg: tags['Make']?.description ?? '',
        cameraModel: tags['Model']?.description ?? '',
      },
      selected: false,
    };

    this.assets.push(newAsset);
  }

  toggleSelect(asset: EXIFAsset) {
    asset.selected = !asset.selected;
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
