import { createZoomImageWheel, type ZoomImageWheelState } from '@zoom-image/core';
import { SvelteSet } from 'svelte/reactivity';

type ZoomImageActionOptions = {
  zoomTarget?: HTMLElement;
  src?: string;
  locked?: boolean;
  onZoomChange?: (state: ZoomImageWheelState) => void;
};

export const zoomImageAction = (node: HTMLElement, options?: ZoomImageActionOptions) => {
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    zoomTarget: options?.zoomTarget,
  });

  const unsubscribes = [zoomInstance.subscribe(({ state }) => options?.onZoomChange?.(state))];

  const controller = new AbortController();
  const { signal } = controller;

  // Intercept events in capture phase to prevent zoom-image from seeing interactions on
  // overlay elements (e.g. the box-editing canvas), preserving their own handlers.
  const isOverlayEvent = (event: Event) => !!(event.target as HTMLElement).closest('[data-overlay-interactive]');
  const isOverlayAtPoint = (x: number, y: number) =>
    !!document.elementFromPoint(x, y)?.closest('[data-overlay-interactive]');

  // Pointer event interception: track pointers that start on overlays and intercept the entire gesture.
  const overlayPointers = new SvelteSet<number>();
  const interceptedPointers = new SvelteSet<number>();
  const interceptOverlayPointerDown = (event: PointerEvent) => {
    if (isOverlayEvent(event) || isOverlayAtPoint(event.clientX, event.clientY)) {
      overlayPointers.add(event.pointerId);
      interceptedPointers.add(event.pointerId);
      event.stopPropagation();
    } else if (overlayPointers.size > 0) {
      // Split gesture (e.g. pinch with one finger on overlay) — intercept entirely.
      interceptedPointers.add(event.pointerId);
      event.stopPropagation();
    }
  };
  const interceptOverlayPointerEvent = (event: PointerEvent) => {
    if (interceptedPointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  };
  const interceptOverlayPointerEnd = (event: PointerEvent) => {
    overlayPointers.delete(event.pointerId);
    if (interceptedPointers.delete(event.pointerId)) {
      event.stopPropagation();
    }
  };
  node.addEventListener('pointerdown', interceptOverlayPointerDown, { capture: true, signal });
  node.addEventListener('pointermove', interceptOverlayPointerEvent, { capture: true, signal });
  node.addEventListener('pointerup', interceptOverlayPointerEnd, { capture: true, signal });
  node.addEventListener('pointerleave', interceptOverlayPointerEnd, { capture: true, signal });

  // Wheel and dblclick interception on overlay elements.
  // Dblclick also intercepted for all touch double-taps (Safari fires synthetic dblclick
  // on double-tap, which conflicts with zoom-image's touch zoom handler).
  let lastPointerWasTouch = false;
  node.addEventListener('pointerdown', (event) => (lastPointerWasTouch = event.pointerType === 'touch'), {
    capture: true,
    signal,
  });
  node.addEventListener(
    'dblclick',
    (event) => {
      if (lastPointerWasTouch || isOverlayEvent(event)) {
        event.stopImmediatePropagation();
      }
    },
    { capture: true, signal },
  );

  node.style.overflow = 'visible';
  node.style.touchAction = 'none';
  return {
    update(newOptions?: ZoomImageActionOptions) {
      const previous = options;
      options = newOptions;
      if (newOptions?.zoomTarget !== undefined) {
        zoomInstance.setState({ zoomTarget: newOptions.zoomTarget });
      }
      if (newOptions?.src !== previous?.src) {
        zoomInstance.setState({ currentZoom: 1 });
      }
      if (newOptions?.locked !== previous?.locked) {
        if (newOptions?.locked) {
          zoomInstance.setState({ currentZoom: 1 });
          zoomInstance.setState({ enable: false });
        } else {
          zoomInstance.setState({ enable: true });
        }
      }
    },
    destroy() {
      controller.abort();
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      zoomInstance.cleanup();
    },
  };
};
