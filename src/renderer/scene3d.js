import * as THREE from '../../node_modules/three/build/three.module.js';

const WALL_HEIGHT = 2.45;
const EYE_HEIGHT = 1.58;
const DOOR_HEIGHT = 2.05;
const WALL_COLOR = 0x0b1110;
const EDGE_COLOR = 0xdde7e1;

export class Scene3D {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.cameraState = camera;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020303);
    this.camera = new THREE.PerspectiveCamera(60, 1, .05, 60);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.world = null;

    this.scene.add(new THREE.HemisphereLight(0x809a90, 0x010202, 1.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(4, 8, 3);
    this.scene.add(keyLight);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render(world) {
    if (world !== this.world) {
      this.setWorld(world);
    }

    const camera = this.cameraState;
    this.camera.fov = THREE.MathUtils.radToDeg(camera.fov);
    this.camera.position.set(
      camera.position.x,
      EYE_HEIGHT,
      camera.position.y
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = -camera.angle - Math.PI * .5;
    this.camera.rotation.x = camera.pitch ?? 0;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }

  setWorld(world) {
    this.world = world;
    this.worldGroup?.removeFromParent();
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    for (const block of this.getWallBlocks(world.map)) {
      this.addWallBlock(block);
    }

    for (const door of world.doors) {
      this.addDoorLintel(door);
    }

    for (const crate of world.crates) {
      this.addCrate(crate);
    }

    for (const barrel of world.barrels) {
      this.addBarrel(barrel);
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(world.width, world.height),
      new THREE.MeshStandardMaterial({ color: 0x050807, roughness: 1 })
    );
    floor.rotation.x = -Math.PI * .5;
    floor.position.set(world.width * .5, 0, world.height * .5);
    this.worldGroup.add(floor);
  }

  getWallBlocks(map) {
    const visited = map.map(row => Array(row.length).fill(false));
    const blocks = [];

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] !== '#' || visited[y][x]) continue;

        let width = 0;
        while (map[y][x + width] === '#' && !visited[y][x + width]) {
          width++;
        }

        let height = 1;
        let canGrow = true;
        while (canGrow && y + height < map.length) {
          for (let column = x; column < x + width; column++) {
            if (map[y + height][column] !== '#' || visited[y + height][column]) {
              canGrow = false;
              break;
            }
          }
          if (canGrow) height++;
        }

        for (let row = y; row < y + height; row++) {
          for (let column = x; column < x + width; column++) {
            visited[row][column] = true;
          }
        }

        blocks.push({ x, y, width, height });
      }
    }

    return blocks;
  }

  addWallBlock({ x, y, width, height }) {
    const geometry = new THREE.BoxGeometry(width, WALL_HEIGHT, height);
    const material = new THREE.MeshBasicMaterial({
      color: WALL_COLOR,
      transparent: true,
      opacity: 0
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x + width * .5, WALL_HEIGHT * .5, y + height * .5);
    this.addEdges(wall);
  }

  addDoorLintel(door) {
    const lintelHeight = WALL_HEIGHT - DOOR_HEIGHT;
    const geometry = new THREE.BoxGeometry(
      1,
      lintelHeight,
      1
    );
    const lintel = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: WALL_COLOR, transparent: true, opacity: 0 })
    );
    lintel.position.set(
      door.x,
      DOOR_HEIGHT + lintelHeight * .5,
      door.y
    );
    this.addEdges(lintel);
  }

  addCrate(crate) {
    const group = new THREE.Group();
    const crateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(.72, .72, .72),
      new THREE.MeshBasicMaterial({ color: WALL_COLOR, transparent: true, opacity: 0 })
    );
    crateMesh.position.y = .36;
    group.add(crateMesh);
    this.addEdges(crateMesh, group);
    this.addCrateBraces(group);
    group.position.set(crate.x, 0, crate.y);
    this.worldGroup.add(group);
  }

  addBarrel(barrel) {
    const group = new THREE.Group();
    const barrelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(.29, .33, .82, 16),
      new THREE.MeshBasicMaterial({ color: WALL_COLOR, transparent: true, opacity: 0 })
    );
    barrelMesh.position.y = .41;
    group.add(barrelMesh);
    this.addEdges(barrelMesh, group);
    for (const y of [.18, .41, .64]) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(.32, .022, 6, 16),
        new THREE.MeshBasicMaterial({ color: EDGE_COLOR })
      );
      band.rotation.x = Math.PI * .5;
      band.position.y = y;
      group.add(band);
    }
    group.position.set(barrel.x, 0, barrel.y);
    this.worldGroup.add(group);
  }

  addCrateBraces(group) {
    const edge = .365;
    const points = new Float32Array([
      -edge, -edge, edge, edge, edge, edge,
      edge, -edge, edge, -edge, edge, edge,
      -edge, -edge, -edge, edge, edge, -edge,
      edge, -edge, -edge, -edge, edge, -edge
    ]);
    const braces = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(points, 3)
      ),
      new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: .65 })
    );
    braces.position.y = .36;
    group.add(braces);
  }

  addEdges(mesh, parent = this.worldGroup) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 25),
      new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: .88 })
    );
    edges.position.copy(mesh.position);
    edges.rotation.copy(mesh.rotation);
    edges.scale.copy(mesh.scale);
    parent.add(edges);
  }
}