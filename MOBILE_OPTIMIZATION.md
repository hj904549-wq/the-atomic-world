# The Atomic World — Responsive Update

## What changed

- Added a full-viewport portrait layout with `100dvh`, safe-area padding, compact scene cards, a two-row scene navigator, and touch-sized player controls.
- Added an intermediate tablet layout and a short-landscape layout. The original 16:9 desktop stage and its desktop HUD styling remain the default above the responsive breakpoints.
- Added viewport-aware camera FOV and camera-distance adjustment. The camera is recalculated after resize/orientation changes, including while playback is paused.
- Made the SVG callout projection use the stage's live dimensions instead of a fixed 1920×1080 viewBox.
- Added device-aware rendering caps and frame pacing: 60 FPS desktop, 45 FPS compact devices, and 30 FPS on detected low-power mobile hardware. Pixel ratio is capped by device class; the most constrained tier also uses fewer background stars and lower geometry segment counts.
- Converted the 124-node crystal lattice to one `THREE.InstancedMesh` and reused per-electron position vectors during the animation loop.
- Added pointer-cancel handling, touch-action control for the WebGL canvas and timeline, safe fullscreen handling, and a visible fallback notice when Three.js/WebGL cannot initialize.
- Respects `prefers-reduced-motion` by starting playback paused and reducing decorative CSS motion.
- Added `index.html` so the project can be served from a GitHub Pages project root. `code_artifact.html` remains available as the original page name.

## Project files

- `index.html` — GitHub Pages entry point.
- `code_artifact.html` — same responsive page, retained under its original filename.
- `main.js` — Three.js scene, camera, render quality, input, timeline, and audio updates.
- `style.css` — responsive portrait, tablet, landscape, and reduced-motion rules.

## Validation performed

- `node --check main.js` — passed.
- HTML parser check — passed; no duplicate element IDs detected.
- CSS parser check — passed; no top-level stylesheet parse errors detected.
- Headless Chromium screenshot/WebGL smoke test — attempted, but this execution environment could not initialize EGL/SwiftShader and the browser process timed out. Physical-device checks on Android/iOS and a full browser compatibility matrix therefore remain to be performed after deployment.

## Runtime dependencies and audio note

The supplied project already loads Tailwind CSS, Three.js r128, and Vazirmatn from HTTPS CDNs. No local image, model, or audio files were present in the archive. The existing soundtrack and effects are synthesized by the Web Audio API; that implementation and its 60-second cue timeline were retained. There was no supplied spoken-narration recording to test.
