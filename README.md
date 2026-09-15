# Trace Strike

Trace Strike is a lightweight, minimalist FPS for the browser. The playable world keeps a grid for movement, combat, and line-of-sight, while Three.js renders the architecture as solid WebGL geometry.

## Concept

Navigate a compact test sector, use line of sight to eliminate geometric sentinels, and stay behind cover. Walls are represented by map data and block both movement and hitscan fire.

## Run

Use any local HTTP server from the repository root, for example:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in a modern browser. Opening `index.html` directly with `file://` is not supported because the game uses ES modules.

## Controls

- `W` / `S`: move forward and backward
- `A` / `D`: strafe
- Mouse: rotate the camera
- Left click: fire the sidearm
- `R`: reload (18-round magazine with reserve ammunition)
- `Esc`: pause

## Architecture

The project follows `src/doc/TRACE_STRIKE_ARCHITECTURE.md`:

- `core`: game orchestration, state, input, and frame loop
- `renderer`: camera, projection, raycasting, and Canvas drawing
- `world`: map data, geometry, world storage, and collision
- `player`: movement, weapon, and future projectile extension point
- `entities`: entity base, enemies, and finite-state AI
- `systems`: combat, damage, interactions, and geometric effects
- `ui`: HUD, crosshair, menu, and pause screens
- `audio`: small Web Audio API synthesizer for feedback
- `config`: centralized gameplay and rendering values

## Main systems

The renderer uses Three.js to build connected wall prisms, door lintels, crates, and barrels with real depth and occlusion. Doorways are gaps in the wall geometry, rather than overlay drawings. Enemy visibility uses the grid raycaster line-of-sight test, so walls hide entities behind them. Combat performs a forward hitscan and checks map geometry before applying damage. Collision uses the same map cells that define the walls, keeping the logical and visual world aligned.

The visual language is intentionally wireframe: black space, white geometry, red humanoid enemies, green telemetry, a geometric weapon silhouette, a compact radar, short tracers, and restrained muzzle/reload feedback. The scene uses a clear horizon with sparse converging floor and wall contours instead of a dense infinite grid, matching the reference's technical corridor composition. Enemies progress through waves of 2, 4, 6, and more hostiles. The sidearm uses an 18-round magazine, 36 initial reserve rounds, and a 144-round reserve cap.

## Requirements

- Modern browser with ES module and Canvas 2D support
- Python 3, or another static HTTP server
- Node.js and npm, to install the lightweight `three` dependency

The architecture document is preserved at `src/doc/TRACE_STRIKE_ARCHITECTURE.md`.
