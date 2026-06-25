<script lang="ts">
  import { zoomImageAction } from '$lib/components/zoom-image.svelte';
  import type { squareBox } from '$lib/pets-uploader-manager.svelte';
  import { Canvas, type FabricObject, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount, type Snippet } from 'svelte';

  type Props = {
    src: string;
    alt?: string;
    boxes?: squareBox[];
    onChange?: (boxes: squareBox[]) => void;
    onActiveChange?: (active: boolean, petId?: string) => void;
    follow?: Snippet<[squareBox]>;
  };

  let { src, alt = '', boxes = [], onChange, onActiveChange, follow }: Props = $props();

  const dragPadding = 16;
  let containerEl = $state<HTMLDivElement>();
  let zoomEl = $state<HTMLDivElement>();
  let imgEl = $state<HTMLImageElement>();
  let canvasEl = $state<HTMLCanvasElement>();
  let followEl = $state<HTMLDivElement>();
  let canvas: Canvas | undefined;
  let imgW = 0;
  let imgH = 0;
  let currentZoom = 1;
  let currentPositionX = 0;
  let currentPositionY = 0;
  let boxActive = $state(false);
  const onZoomChange = (state: { currentZoom: number; currentPositionX: number; currentPositionY: number }) => {
    currentZoom = state.currentZoom;
    currentPositionX = state.currentPositionX;
    currentPositionY = state.currentPositionY;
    applyViewport();
    positionFollow();
  };

  const applyViewport = () => {
    if (!canvas) {
      return;
    }
    canvas.setViewportTransform([1, 0, 0, 1, dragPadding, dragPadding]);

    const offset = dragPadding * (1 - currentZoom);
    const x = currentPositionX + offset;
    const y = currentPositionY + offset;

    const style = canvas.wrapperEl.style;
    style.transformOrigin = '0 0';
    style.translate = `${x}px ${y}px`;
    style.scale = `${currentZoom}`;
  };

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
    const cw = imgW;
    const ch = imgH;

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
    if (!canvas || !imgW || !imgH) {
      return [];
    }
    const cw = imgW;
    const ch = imgH;
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
    boxActive = !!active;
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
    const cw = imgW;
    const ch = imgH;
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
    const iw = imgEl.clientWidth;
    const ih = imgEl.clientHeight;
    if (!iw || !ih) {
      return;
    }
    if (iw === imgW && ih === imgH) {
      applyViewport();
      return;
    }

    const current = snapshot();
    imgW = iw;
    imgH = ih;
    canvas.setDimensions({ width: iw + dragPadding * 2, height: ih + dragPadding * 2 });
    applyViewport();
    if (current.length > 0) {
      loadBoxes(current);
    } else {
      canvas.requestRenderAll();
    }
  };

  const onImageLoad = () => {
    if (!canvas) {
      return;
    }
    sizeCanvasToImage();
    loadBoxes(boxes);
  };

  export function addSquare() {
    if (!canvas) {
      return;
    }
    const size = Math.min(120, imgW, imgH);
    const rect = makeRect((imgW - size) / 2, (imgH - size) / 2, size, size);
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

  $effect(() => {
    if (canvas) {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'move';
    }
  });

  $effect(() => {
    positionFollow();
  });

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

    const cw = imgW;
    const ch = imgH;
    const box = active.getBoundingRect();
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

    const clampLeft = (left: number) =>
      bounds ? clamp(left, bounds.left, Math.max(bounds.left, bounds.right - panelWidth)) : left;
    const clampTop = (top: number) =>
      bounds ? clamp(top, bounds.top, Math.max(bounds.top, bounds.bottom - panelHeight)) : top;

    const positions = [
      {
        room: bounds ? bounds.bottom - boxBottom : Infinity,
        need: panelHeight,
        top: boxBottom,
        left: clampLeft(box.left),
      },
      { room: bounds ? bounds.right - boxRight : Infinity, need: panelWidth, top: clampTop(box.top), left: boxRight },
      {
        room: bounds ? box.left - bounds.left : Infinity,
        need: panelWidth,
        top: clampTop(box.top),
        left: box.left - panelWidth,
      },
      {
        room: bounds ? box.top - bounds.top : Infinity,
        need: panelHeight,
        top: box.top - panelHeight,
        left: clampLeft(box.left),
      },
    ];

    let bestPosition = positions.find((position) => position.room >= position.need);
    if (!bestPosition) {
      bestPosition = positions[0];
      for (const position of positions) {
        if (position.room > bestPosition.room) {
          bestPosition = position;
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
    canvas.wrapperEl.style.top = `-${dragPadding}px`;
    canvas.wrapperEl.style.left = `-${dragPadding}px`;
    canvas.wrapperEl.style.overflow = 'visible';
    canvas.wrapperEl.dataset.overlayInteractive = '';

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

    canvas.defaultCursor = 'default';

    sizeCanvasToImage();
    if (imgEl?.complete) {
      onImageLoad();
    }

    const observer = new ResizeObserver(() => sizeCanvasToImage());
    if (imgEl) {
      observer.observe(imgEl);
    }
    const clipEl = containerEl?.parentElement?.parentElement;
    if (clipEl) {
      observer.observe(clipEl);
    }

    return () => {
      observer.disconnect();
      canvas?.dispose();
      canvas = undefined;
    };
  });
</script>

<div class="relative inline-block leading-none">
  <div
    bind:this={containerEl}
    use:zoomImageAction={{ zoomTarget: zoomEl, src, onZoomChange, locked: boxActive }}
    class="relative inline-block leading-none"
  >
    <div bind:this={zoomEl} class="relative inline-block leading-none">
      <img
        bind:this={imgEl}
        {src}
        {alt}
        onload={onImageLoad}
        class="block h-[63dvh] w-auto select-none"
        draggable="false"
      />
    </div>
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
