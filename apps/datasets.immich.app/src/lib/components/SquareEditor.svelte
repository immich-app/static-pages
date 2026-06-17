<script lang="ts">
  import type { squareBox } from '$lib/pets-uploader-manager.svelte';
  import { Canvas, type FabricObject, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount, type Snippet } from 'svelte';

  type Props = {
    src: string;
    alt?: string;
    boxes?: squareBox[];
    panEnabled?: boolean;
    zoom?: number;
    onChange?: (boxes: squareBox[]) => void;
    onActiveChange?: (active: boolean, petId?: string) => void;
    follow?: Snippet<[squareBox]>;
  };

  let {
    src,
    alt = '',
    boxes = [],
    panEnabled = $bindable(true),
    zoom = $bindable(1),
    onChange,
    onActiveChange,
    follow,
  }: Props = $props();

  let rootEl = $state<HTMLDivElement>();
  let imgEl = $state<HTMLImageElement>();
  let canvasEl = $state<HTMLCanvasElement>();
  let followEl = $state<HTMLDivElement>();
  let canvas: Canvas | undefined;
  let panX = $state(0);
  let panY = $state(0);
  const minZoom = 1;
  const maxZoom = 6;
  const minBoxSize = 10;
  let panning = false;
  let panOrigin = { x: 0, y: 0, panX: 0, panY: 0 };
  let lastWidth = 0;
  let lastHeight = 0;

  let activeBox = $state<squareBox>({ left: 0, top: 0, width: 0, height: 0 });
  const petIds = new WeakMap<FabricObject, string | undefined>();
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  let drawing = false;
  let drawOrigin = { x: 0, y: 0 };
  let draftRect: Rect | undefined;

  const startDraw = (event: MouseEvent) => {
    if (!canvas) {
      return;
    }
    const p = canvas.getScenePoint(event);
    drawing = true;
    drawOrigin = { x: p.x, y: p.y };
    draftRect = makeRect(p.x, p.y, 0, 0);
    draftRect.selectable = false;
    draftRect.evented = false;
    petIds.set(draftRect, undefined);
    canvas.add(draftRect);
    canvas.requestRenderAll();
  };

  const onDrawMove = (event: MouseEvent) => {
    if (!drawing || !canvas || !draftRect) {
      return;
    }
    const p = canvas.getScenePoint(event);
    const px = clamp(p.x, 0, canvas.width);
    const py = clamp(p.y, 0, canvas.height);
    draftRect.set({
      left: Math.min(drawOrigin.x, px),
      top: Math.min(drawOrigin.y, py),
      width: Math.abs(px - drawOrigin.x),
      height: Math.abs(py - drawOrigin.y),
    });
    draftRect.setCoords();
    canvas.requestRenderAll();
  };

  const endDraw = () => {
    if (!drawing || !canvas) {
      return;
    }
    drawing = false;
    const rect = draftRect;
    draftRect = undefined;
    if (!rect) {
      return;
    }

    if (rect.width < minBoxSize || rect.height < minBoxSize) {
      canvas.remove(rect);
      canvas.requestRenderAll();
      return;
    }

    rect.selectable = true;
    rect.evented = true;
    constrainToCanvas(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    emitChange();
    syncActive();
  };
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
      originX: 'left',
      originY: 'top',
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
    const active = canvas?.getActiveObject();
    onActiveChange?.(!!active, active ? petIds.get(active) : undefined);
    positionFollow();
  };

  let loadingBoxes = false;

  const removeUnassigned = () => {
    if (!canvas || loadingBoxes) {
      return;
    }
    const active = canvas.getActiveObject();
    const soloBoxes = canvas.getObjects().filter((object) => object !== active && petIds.get(object) == null);
    if (soloBoxes.length === 0) {
      return;
    }
    canvas.remove(...soloBoxes);
    canvas.requestRenderAll();
    emitChange();
  };

  const onSelectionChange = () => {
    removeUnassigned();
    syncActive();
  };

  const loadBoxes = (source: squareBox[]) => {
    if (!canvas) {
      return;
    }
    const cw = canvas.width;
    const ch = canvas.height;
    loadingBoxes = true;
    canvas.remove(...canvas.getObjects());
    for (const box of source) {
      const rect = makeRect(box.left * cw, box.top * ch, box.width * cw, box.height * ch);
      petIds.set(rect, box.petId);
      canvas.add(rect);
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    loadingBoxes = false;
    syncActive();
  };

  export function refresh() {
    loadBoxes(boxes);
  }

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
    panX = 0;
    panY = 0;
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

  export function deselector() {
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
    const next = Math.min(maxZoom, Math.max(minZoom, zoom * factor));
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
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  $effect(() => {
    if (canvas) {
      canvas.defaultCursor = panEnabled ? 'grab' : 'crosshair';
      canvas.hoverCursor = panEnabled ? 'move' : 'crosshair';
      canvas.moveCursor = panEnabled ? 'move' : 'crosshair';
    }
  });

  $effect(() => {
    positionFollow();
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
      canvas.defaultCursor = panEnabled ? 'grab' : 'crosshair';
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
    const followBox = active.getBoundingRect();

    const box = {
      left: panX + followBox.left * zoom,
      top: panY + followBox.top * zoom,
      width: followBox.width * zoom,
      height: followBox.height * zoom,
    };
    const panelWidth = followEl.offsetWidth;
    const panelHeight = followEl.offsetHeight;

    const wrapper = followEl.offsetParent as HTMLElement | null;
    const clipEl = wrapper?.parentElement ?? wrapper;
    let bounds: { top: number; left: number; right: number; bottom: number } | undefined;
    if (wrapper && clipEl) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const clipRect = clipEl.getBoundingClientRect();
      bounds = {
        top: clipRect.top - wrapperRect.top,
        left: clipRect.left - wrapperRect.left,
        right: clipRect.right - wrapperRect.left,
        bottom: clipRect.bottom - wrapperRect.top,
      };
    }
    const boxBottom = box.top + box.height;
    const boxRight = box.left + box.width;

    const clampX = (left: number) =>
      bounds ? clamp(left, bounds.left, Math.max(bounds.left, bounds.right - panelWidth)) : left;
    const clampY = (top: number) =>
      bounds ? clamp(top, bounds.top, Math.max(bounds.top, bounds.bottom - panelHeight)) : top;

    const placements = [
      {
        room: bounds ? bounds.bottom - boxBottom : Infinity,
        need: panelHeight,
        top: boxBottom,
        left: clampX(box.left),
      },
      { room: bounds ? bounds.right - boxRight : Infinity, need: panelWidth, top: clampY(box.top), left: boxRight },
      {
        room: bounds ? box.left - bounds.left : Infinity,
        need: panelWidth,
        top: clampY(box.top),
        left: box.left - panelWidth,
      },
      {
        room: bounds ? box.top - bounds.top : Infinity,
        need: panelHeight,
        top: box.top - panelHeight,
        left: clampX(box.left),
      },
    ];

    let position = placements.find((p) => p.room >= p.need);
    if (!position) {
      position = placements[0];
      for (const p of placements) {
        if (p.room > position.room) {
          position = p;
        }
      }
    }

    followEl.style.top = `${position.top}px`;
    followEl.style.left = `${position.left}px`;
    activeBox = {
      left: followBox.left / cw,
      top: followBox.top / ch,
      width: followBox.width / cw,
      height: followBox.height / ch,
      petId: petIds.get(active),
    };
  }

  export function assignActivePet(petId: string | undefined) {
    const active = canvas?.getActiveObject();
    if (!active) {
      return;
    }
    petIds.set(active, petId);
    onActiveChange?.(true, petId);
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

    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    canvas.on('selection:cleared', onSelectionChange);
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
      if (opt.target) {
        return;
      }
      if (panEnabled) {
        startPan(opt.e as MouseEvent);
      } else {
        startDraw(opt.e as MouseEvent);
      }
    });
    canvas.on('mouse:move', (opt) => onDrawMove(opt.e as MouseEvent));
    canvas.on('mouse:up', endDraw);
    canvas.defaultCursor = panEnabled ? 'grab' : 'crosshair';

    sizeCanvasToImage();
    if (imgEl?.complete) {
      onImageLoad();
    }

    const observer = new ResizeObserver(() => sizeCanvasToImage());
    if (imgEl) {
      observer.observe(imgEl);
    }

    return () => {
      observer.disconnect();
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
      class="block h-[60dvh] w-auto select-none"
      draggable="false"
    />
    <canvas bind:this={canvasEl}></canvas>
  </div>

  {#if follow}
    <div
      bind:this={followEl}
      data-square-control
      class="pointer-events-none absolute z-10 transition-[top,left] duration-200 ease-out"
      style="display: none;"
    >
      {@render follow(activeBox)}
    </div>
  {/if}
</div>
