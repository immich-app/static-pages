<script lang="ts">
  import type { squareBox } from '$lib/pets-uploader-manager.svelte';
  import { Canvas, type FabricObject, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount, type Snippet } from 'svelte';

  type Props = {
    src: string;
    alt?: string;
    boxes?: squareBox[];
    panEnabled?: boolean;
    onChange?: (boxes: squareBox[]) => void;
    onActiveChange?: (active: boolean) => void;
    follow?: Snippet<[squareBox]>;
  };

  let { src, alt = '', boxes = [], panEnabled = $bindable(true), onChange, onActiveChange, follow }: Props = $props();

  let rootEl = $state<HTMLDivElement>();
  let imgEl = $state<HTMLImageElement>();
  let canvasEl = $state<HTMLCanvasElement>();
  let followEl = $state<HTMLDivElement>();
  let canvas: Canvas | undefined;
  let zoom = $state(0.9);
  let panX = $state(1);
  let panY = $state(26);
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 6;
  let panning = false;
  let panOrigin = { x: 0, y: 0, panX: 0, panY: 0 };
  let lastWidth = 0;
  let lastHeight = 0;

  let activeBox = $state<squareBox>({ left: 0, top: 0, width: 0, height: 0 });
  const petIds = new WeakMap<FabricObject, string | undefined>();

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const configureControlStyle = () => {
    InteractiveFabricObject.ownDefaults = {
      ...InteractiveFabricObject.ownDefaults,
      cornerStyle: 'circle',
      cornerColor: 'rgb(153,166,251)',
      cornerSize: 10,
      padding: 6,
      transparentCorners: false,
      lockRotation: true,
      lockScalingFlip: true,
      hasBorders: true,
    };
  };

  const makeRect = (left: number, top: number, width: number, height: number) =>
    new Rect({
      left,
      top,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      fill: 'rgba(66,80,175,0.25)',
      stroke: 'rgb(66,80,175)',
      strokeWidth: 2,
      strokeUniform: true,
      rx: 8,
      ry: 8,
      objectCaching: false,
    });

  const constrainToCanvas = (object?: FabricObject) => {
    if (!canvas || !object) {
      return;
    }
    const cw = canvas.width;
    const ch = canvas.height;

    const sw = object.strokeWidth ?? 0;
    object.setCoords();
    let rect = object.getBoundingRect();
    if (rect.width > cw && rect.width > sw) {
      object.scaleX *= (cw - sw) / (rect.width - sw);
    }
    if (rect.height > ch && rect.height > sw) {
      object.scaleY *= (ch - sw) / (rect.height - sw);
    }

    object.setCoords();
    rect = object.getBoundingRect();
    if (rect.left < 0) {
      object.left -= rect.left;
    }
    if (rect.top < 0) {
      object.top -= rect.top;
    }
    if (rect.left + rect.width > cw) {
      object.left -= rect.left + rect.width - cw;
    }
    if (rect.top + rect.height > ch) {
      object.top -= rect.top + rect.height - ch;
    }
    object.setCoords();
  };

  const snapshot = (): squareBox[] => {
    if (!canvas || !canvas.width || !canvas.height) {
      return [];
    }
    const cw = canvas.width;
    const ch = canvas.height;
    return canvas.getObjects().map((object) => ({
      left: object.left / cw,
      top: object.top / ch,
      width: (object.width * object.scaleX) / cw,
      height: (object.height * object.scaleY) / ch,
      petId: petIds.get(object),
    }));
  };

  const emitChange = () => onChange?.(snapshot());
  const syncActive = () => {
    onActiveChange?.(!!canvas?.getActiveObject());
    positionFollow();
  };

  const loadBoxes = (source: squareBox[]) => {
    if (!canvas) {
      return;
    }
    const cw = canvas.width;
    const ch = canvas.height;
    canvas.remove(...canvas.getObjects());
    for (const box of source) {
      const rect = makeRect(box.left * cw, box.top * ch, box.width * cw, box.height * ch);
      petIds.set(rect, box.petId);
      canvas.add(rect);
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncActive();
  };

  const sizeCanvasToImage = () => {
    if (!canvas || !imgEl) {
      return;
    }
    const width = imgEl.clientWidth;
    const height = imgEl.clientHeight;
    if (!width || !height) {
      return;
    }
    if (width === lastWidth && height === lastHeight) {
      return;
    }

    const current = snapshot();
    canvas.setDimensions({ width, height });
    lastWidth = width;
    lastHeight = height;
    if (current.length > 0) {
      loadBoxes(current);
    } else {
      canvas.renderAll();
    }
  };

  const onImageLoad = () => {
    if (!canvas) {
      return;
    }
    lastWidth = 0;
    lastHeight = 0;
    sizeCanvasToImage();
    loadBoxes(boxes);
  };

  export function addSquare() {
    if (!canvas) {
      return;
    }
    const size = Math.min(120, canvas.width, canvas.height);
    const rect = makeRect((canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
    petIds.set(rect, undefined);
    canvas.add(rect);
    canvas.setActiveObject(rect);
    constrainToCanvas(rect);
    canvas.requestRenderAll();
    emitChange();
    syncActive();
  }

  export function deleteSquare() {
    if (!canvas) {
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      return;
    }
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    emitChange();
    syncActive();
  }

  export function deselectr() {
    if (canvas?.getActiveObject()) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      syncActive();
    }
  }

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    if (!rootEl) {
      return;
    }
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    if (next === zoom) {
      return;
    }

    const rect = rootEl.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    panX += px * (1 - next / zoom);
    panY += py * (1 - next / zoom);
    zoom = next;
  };

  const zoomFromCenter = (factor: number) => {
    if (!rootEl) {
      return;
    }
    const rect = rootEl.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  export function zoomIn() {
    zoomFromCenter(1.2);
  }

  export function zoomOut() {
    zoomFromCenter(1 / 1.2);
  }

  export function resetView() {
    zoom = 0.9;
    panX = 0;
    panY = 26;
  }

  $effect(() => {
    if (canvas) {
      canvas.defaultCursor = panEnabled ? 'grab' : 'default';
    }
  });

  const onPanMove = (event: PointerEvent) => {
    if (!panning) {
      return;
    }
    panX = panOrigin.panX + (event.clientX - panOrigin.x);
    panY = panOrigin.panY + (event.clientY - panOrigin.y);
  };

  const onPanEnd = () => {
    if (!panning) {
      return;
    }
    panning = false;
    if (canvas) {
      canvas.defaultCursor = panEnabled ? 'grab' : 'default';
    }
    globalThis.removeEventListener('pointermove', onPanMove);
    globalThis.removeEventListener('pointerup', onPanEnd);
  };

  const startPan = (event: MouseEvent) => {
    panning = true;
    panOrigin = { x: event.clientX, y: event.clientY, panX, panY };
    if (canvas) {
      canvas.defaultCursor = 'grabbing';
    }
    globalThis.addEventListener('pointermove', onPanMove);
    globalThis.addEventListener('pointerup', onPanEnd);
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.1 : 1 / 1.1);
  };

  const onWindowPointerDown = (event: PointerEvent) => {
    if (!canvas?.getActiveObject()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target || rootEl?.contains(target) || target.closest('[data-square-control]') || !canvasEl?.contains(target)) {
      return;
    }
    deselectr();
  };
  const FOLLOW_GAP = 15;

  function positionFollow() {
    if (!canvas || !followEl) {
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      followEl.style.display = 'none';
      return;
    }
    followEl.style.display = '';

    const cw = canvas.width;
    const ch = canvas.height;
    const gap = FOLLOW_GAP;
    const padding = active.padding ?? 0;
    const rawBox = active.getBoundingRect();
    const box = {
      left: rawBox.left - padding,
      top: rawBox.top - padding,
      width: rawBox.width + padding * 2,
      height: rawBox.height + padding * 2,
    };
    const panelWidth = followEl.offsetWidth;
    const panelHeight = followEl.offsetHeight;

    const clampTop = (top: number) => clamp(top, gap, Math.max(gap, ch - panelHeight - gap));
    const clampLeft = (left: number) => clamp(left, gap, Math.max(gap, cw - panelWidth - gap));

    const overlapArea = (position: { top: number; left: number }) => {
      const panelRight = position.left + panelWidth;
      const panelBottom = position.top + panelHeight;
      const boxRight = box.left + box.width;
      const boxBottom = box.top + box.height;

      const overlapX = Math.max(0, Math.min(panelRight, boxRight) - Math.max(position.left, box.left));
      const overlapY = Math.max(0, Math.min(panelBottom, boxBottom) - Math.max(position.top, box.top));
      return overlapX * overlapY;
    };

    const boxBottom = box.top + box.height;
    const boxRight = box.left + box.width;

    const positions = [
      { top: clampTop(boxBottom + gap), left: clampLeft(box.left) },
      { top: clampTop(box.top - panelHeight - gap), left: clampLeft(box.left) },
      { top: clampTop(box.top), left: clampLeft(boxRight + gap) },
      { top: clampTop(box.top), left: clampLeft(box.left - panelWidth - gap) },
    ];

    let bestPosition = positions[0];
    let leastOverlap = Infinity;

    for (const position of positions) {
      const overlap = overlapArea(position);
      if (overlap < leastOverlap) {
        leastOverlap = overlap;
        bestPosition = position;
        if (overlap === 0) {
          break;
        }
      }
    }

    followEl.style.top = `${bestPosition.top}px`;
    followEl.style.left = `${bestPosition.left}px`;
    activeBox = {
      left: box.left / cw,
      top: box.top / ch,
      width: box.width / cw,
      height: box.height / ch,
      petId: petIds.get(active),
    };
  }

  export function assignActivePet(petId: string | undefined) {
    const active = canvas?.getActiveObject();
    if (!active) {
      return;
    }
    petIds.set(active, petId);
    positionFollow();
    emitChange();
  }

  onMount(() => {
    if (!canvasEl) {
      return;
    }
    configureControlStyle();
    canvas = new Canvas(canvasEl, { selection: false });

    canvas.wrapperEl.style.position = 'absolute';
    canvas.wrapperEl.style.top = '0';
    canvas.wrapperEl.style.left = '0';

    canvas.on('selection:created', syncActive);
    canvas.on('selection:updated', syncActive);
    canvas.on('selection:cleared', syncActive);
    canvas.on('object:moving', (event) => {
      constrainToCanvas(event.target);
      positionFollow();
      emitChange();
    });
    canvas.on('object:scaling', (event) => {
      constrainToCanvas(event.target);
      positionFollow();
      emitChange();
    });
    canvas.on('object:modified', emitChange);

    canvas.on('mouse:down', (opt) => {
      if (panEnabled && !opt.target) {
        startPan(opt.e as MouseEvent);
      }
    });
    canvas.defaultCursor = panEnabled ? 'grab' : 'default';

    sizeCanvasToImage();
    if (imgEl?.complete) {
      onImageLoad();
    }

    const observer = new ResizeObserver(() => sizeCanvasToImage());
    if (imgEl) {
      observer.observe(imgEl);
    }

    globalThis.addEventListener('pointerdown', onWindowPointerDown);

    return () => {
      observer.disconnect();
      globalThis.removeEventListener('pointerdown', onWindowPointerDown);
      globalThis.removeEventListener('pointermove', onPanMove);
      globalThis.removeEventListener('pointerup', onPanEnd);
      canvas?.dispose();
      canvas = undefined;
    };
  });
</script>

<div class="relative inline-block leading-none">
  <div
    bind:this={rootEl}
    onwheel={onWheel}
    class="relative inline-block leading-none"
    style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: 0 0;"
  >
    <img
      bind:this={imgEl}
      {src}
      {alt}
      onload={onImageLoad}
      class="block max-h-[60dvh] w-auto select-none"
      draggable="false"
    />
    <canvas bind:this={canvasEl}> </canvas>

    {#if follow}
      <div
        bind:this={followEl}
        data-square-control
        class="absolute z-10 transition-[top,left] duration-200 ease-out"
        style="display: none;"
      >
        {@render follow(activeBox)}
      </div>
    {/if}
  </div>
</div>
