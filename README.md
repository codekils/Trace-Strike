# Trace Strike

Trace Strike is a lightweight, minimalist 2.5D FPS for the browser. The world is made from map geometry and rendered with a Canvas 2D raycaster: no textures, 3D models, game engine, or runtime dependencies are required.

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
- `R`: reload
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

The renderer casts a bounded number of rays per frame and projects wall distance into vertical columns. Enemy visibility uses camera-space projection, while combat performs a forward hitscan and checks map geometry before applying damage. Collision uses the same map cells that define the walls, keeping the logical and visual world aligned.

## Requirements

- Modern browser with ES module and Canvas 2D support
- Python 3, or another static HTTP server
- No npm installation or external package is required

The architecture document is preserved at `src/doc/TRACE_STRIKE_ARCHITECTURE.md`.
