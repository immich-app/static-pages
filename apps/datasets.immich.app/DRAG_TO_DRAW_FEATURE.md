# Drag-to-draw ("box drag") feature — removed code + how to rebuild it

This feature was **removed** on 2026-06-17 so you can re-implement it yourself as a
learning exercise. Everything you need to put it back is in this file.

> **Note on the lock button.** The *original* version had a small **lock button** in the
> top-right corner of the image that switched between two modes: dragging either *panned*
> the zoomed photo or *drew* a box. Per your request that lock button is gone, and this
> guide now covers a **simpler lock-free version: dragging on the photo always draws a
> box.** The only thing you give up is pan-by-dragging — you still move around with the
> **Zoom In / Zoom Out / Center Image** buttons. (If you ever want the original two-mode
> lock-button version back, it lives in this project's git history.)

Two files were touched when the feature was removed:

- `src/lib/components/SquareEditor.svelte` — the canvas editor
- `src/routes/projects/pets/+page.svelte` — the pets page

---

## What the feature does

The image editor has two ways to make a bounding box:

1. The **"Add Box" button** — drops a fixed 120px box in the middle (this still exists).
2. **Drag-to-draw** — click-and-drag anywhere on the photo to rubber-band a box of any
   size (this is what you're rebuilding).

The whole thing rests on one idea: when you press the mouse down on empty canvas, you
**start a new box**, grow it while the mouse moves, and **finish** it on release.

---

## PART 1 — The code to add (copy/paste to restore the lock-free version)

Everything below goes in **`src/lib/components/SquareEditor.svelte`**. The pets page
(`+page.svelte`) needs **no changes** for this version — there's no button to wire up.

**1a. A `minBoxSize` constant** — sits with the other constants near the top (next to
`minZoom` / `maxZoom`):

```ts
const minBoxSize = 10;
```

**1b. The draw state + the three draw functions** — put these right after the `clamp`
helper, before `configureControlStyle`:

```ts
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
```

**1c. The cursor `$effect`** — show a crosshair so it's obvious you're in draw mode.
Replace the current grab/move version with:

```ts
$effect(() => {
  if (canvas) {
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    canvas.moveCursor = 'crosshair';
  }
});
```

**1d. The mouse wiring inside `onMount`** — find the current `mouse:down` handler (which
starts a pan) and replace it with the draw version, plus the two extra listeners:

```ts
canvas.on('mouse:down', (opt) => {
  if (opt.target) {
    return;
  }
  startDraw(opt.e as MouseEvent);
});
canvas.on('mouse:move', (opt) => onDrawMove(opt.e as MouseEvent));
canvas.on('mouse:up', endDraw);
canvas.defaultCursor = 'crosshair';
```

> That `if (opt.target) { return; }` is important: when the mouse goes down *on an
> existing box*, `opt.target` is that box, so we bail and let Fabric move/resize it. We
> only start drawing on empty canvas.

That's the whole feature. No `panEnabled` prop, no lock button, no page changes.

---

## PART 2 — Build it yourself from scratch (zero coding assumed)

You don't need to memorize the code above. Here's the *thinking*, in plain language, so
you can write it yourself. Build it one step at a time and check the screen after each.

### Background: the three pieces of tech

- **Svelte** = the framework. A `.svelte` file is one component (one piece of UI). The
  `<script>` part is logic; the part below it is the HTML you see.
- **Fabric.js** = a library that turns an HTML `<canvas>` into an interactive drawing
  surface. It gives us rectangles you can click, drag, and resize for free.
- The editor already converts mouse positions to canvas coordinates with
  `canvas.getScenePoint(event)` — that handles zoom for you. You'll lean on it.

### Step 1 — React to the mouse going down

Fabric tells you when the mouse is pressed via `canvas.on('mouse:down', …)`. The handler
gets `opt`, where `opt.target` is the box under the cursor (if any) and `opt.e` is the
raw browser mouse event.

- If `opt.target` exists, the user grabbed an existing box — `return` and let Fabric
  move/resize it.
- Otherwise (empty canvas) — start drawing a new box.

### Step 2 — Start drawing (`startDraw`)

When drawing begins you want a brand-new rectangle that starts with zero size, anchored
where the mouse went down.

1. Convert the mouse point to canvas space: `const p = canvas.getScenePoint(event);`
2. Remember that spot: `drawOrigin = { x: p.x, y: p.y };` — you need it later to know
   which corner is fixed.
3. Set a flag `drawing = true` so the move handler knows a drag is in progress.
4. Make the rectangle with the existing `makeRect(...)` helper at `p.x, p.y` with width
   and height `0`. Store it in `draftRect`.
5. While drawing, the box shouldn't be clickable yet — set `draftRect.selectable = false`
   and `draftRect.evented = false` so it doesn't interfere with the drag.
6. Add it to the canvas: `canvas.add(draftRect)` then `canvas.requestRenderAll()` to
   repaint.

### Step 3 — Grow the box as the mouse moves (`onDrawMove`)

Hook `canvas.on('mouse:move', …)`. First line: if `drawing` is false (or there's no
draft box), `return` immediately — you only resize while a drag is active.

The trick: the user can drag in **any** direction, so you can't assume the start point is
the top-left. For each axis:

- left/top = the **smaller** of start and current (`Math.min`)
- width/height = the **distance** between them (`Math.abs(current - start)`)

Clamp the current point to the canvas with the existing `clamp(...)` helper so you can't
draw off the edge. Apply the four numbers with `draftRect.set({...})`, then
`draftRect.setCoords()` (recomputes the box's corners) and `requestRenderAll()`.

**Check:** dragging on the photo should now rubber-band a rectangle.

### Step 4 — Finish the box (`endDraw`)

Hook `canvas.on('mouse:up', …)`. Set `drawing = false`. Then handle two cases:

- **Too tiny** (width or height under `minBoxSize`, e.g. 10px) — the user basically just
  clicked, not dragged. Throw the draft away: `canvas.remove(rect)` and stop. This is
  what makes an accidental click *not* litter the photo with zero-size boxes.
- **Big enough** — promote it to a real box: set `selectable = true` and
  `evented = true`, run `constrainToCanvas(rect)` (keeps it inside the image), select it
  with `canvas.setActiveObject(rect)`, then call `emitChange()` (saves it) and
  `syncActive()` (updates the floating label panel). Those two helpers already exist.

### Step 5 — Cursor polish

Set the canvas cursor to `'crosshair'` so it's obvious you're in "draw a box" mode.
That's the `$effect` block — an `$effect` re-runs automatically whenever something it
reads changes.

### Common beginner mistakes (these cost real debugging time)

- **Fabric listens to `mouse:*`, not `pointer:*`.** Use `mouse:down/move/up`.
- **Always guard with an early `return`.** `onDrawMove` and `endDraw` must bail when
  `drawing` is false, or they'll fire on every stray mouse move.
- **Repaint after every change** with `canvas.requestRenderAll()` — otherwise your edits
  are invisible until something else triggers a redraw.
- **Min-size check = click vs drag.** Without it, a single click leaves an invisible
  zero-size box behind.
- **Let Fabric handle existing boxes.** The `if (opt.target) return;` line is what keeps
  drawing from fighting with moving/resizing a box you already made.

### How to test as you go

Start the dev server (see the project's run notes), open the pets page, add a photo, and
after each step try dragging on the image. Watch the browser devtools console (F12) for
red errors. Build one step at a time — a working tiny piece beats a big broken one.
