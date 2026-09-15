import { COLORS } from '../config/constants.js';
import { Scene3D } from './scene3d.js';
import {
  wallHeight,
  screenX,
  projectPoint,
  projectVerticalSegment,
  worldToCamera
} from './projection.js';

export class Renderer {
  constructor(canvas, camera, raycaster, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.raycaster = raycaster;
    this.ui = ui;
    this.scene3d = new Scene3D(
      document.querySelector('#scene-canvas'),
      camera
    );
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
    this.scene3d?.resize(this.canvas.width, this.canvas.height);
  }

  getHorizon() {
    const offset =
      Number.isFinite(this.camera.horizonOffset)
        ? this.camera.horizonOffset
        : 0;

    return (
      this.canvas.height * 0.5 +
      offset * this.canvas.height
    );
  }

  render(world, enemies, effects, weapon) {
    const { ctx, canvas } = this;
    this.scene3d.render(world);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const visible = enemies.filter(enemy => enemy && !enemy.dead && this.raycaster.hasLineOfSight(this.camera.position, enemy.position)).map(enemy => this.projectEnemy(enemy)).filter(Boolean).sort((a, b) => b.depth - a.depth);
    for (const enemy of visible) this.drawEnemy(ctx, enemy);
    weapon?.render(ctx, canvas.width, canvas.height);
    this.drawRadar(ctx, canvas, enemies);
    effects?.draw?.(ctx, canvas);
    this.ui.drawCrosshair(ctx, canvas, Boolean(weapon?.shot > 0));
  }

  drawAtmosphere(ctx, canvas) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#010202');
    gradient.addColorStop(.48, '#030505');
    gradient.addColorStop(.5, '#050807');
    gradient.addColorStop(1, '#010202');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawPerspectiveFloor(ctx, canvas, horizon) {
    // The floor remains black; perspective comes from architecture.
  }

  drawWalls(ctx, canvas, hits, rays) {
    // Walls are black planes bounded by their projected contours.
  }

  drawWallContours(ctx, canvas, hits, rays) {
    const horizon = this.getHorizon();
    const contourStep = 8;
    ctx.save();
    ctx.strokeStyle = 'rgba(238, 242, 238, .92)';
    ctx.lineWidth = 1;
    let faceStart = null;
    let previous = null;

    for (let index = 0; index < rays; index += contourStep) {
      const hit = hits[index];
      if (!hit) continue;

      const x = screenX(index, canvas.width, rays);
      const height = wallHeight(hit.distance, canvas.height);
      const point = {
        x,
        top: horizon - height * .5,
        bottom: horizon + height * .5,
        distance: hit.distance,
        cellX: hit.cellX,
        cellY: hit.cellY
      };

      if (
        previous &&
        (
          (
            point.cellX !== previous.cellX &&
            point.cellY !== previous.cellY
          ) ||
          Math.abs(point.distance - previous.distance) > .35
        )
      ) {
        this.drawWallFace(ctx, faceStart, previous);
        faceStart = point;
      }

      if (!faceStart) {
        faceStart = point;
      }

      previous = point;
    }

    this.drawWallFace(ctx, faceStart, previous);

    ctx.restore();
  }

  drawWallFace(ctx, start, end) {
    if (!start || !end || end.x - start.x < 2) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.top);
    ctx.lineTo(end.x, end.top);
    ctx.lineTo(end.x, end.bottom);
    ctx.lineTo(start.x, start.bottom);
    ctx.closePath();
    ctx.stroke();

    const inset = Math.min(5, Math.max(2, (end.x - start.x) * .08));
    ctx.save();
    ctx.strokeStyle = 'rgba(238, 242, 238, .38)';
    ctx.beginPath();
    ctx.moveTo(start.x + inset, start.top + inset);
    ctx.lineTo(end.x - inset, end.top + inset);
    ctx.lineTo(end.x - inset, end.bottom - inset);
    ctx.lineTo(start.x + inset, start.bottom - inset);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawPolyline(ctx, points, yOffset = 0) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y + yOffset);
    for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y + yOffset);
    ctx.stroke();
  }

  drawWorldObjects(ctx, world) {
    const objects = world.getObjects?.();
    if (!objects) return;

    const projected = [
      ...(objects.crates ?? []).map(object =>
        this.projectWorldObject(object, .56, 'crate')
      ),
      ...(objects.barrels ?? []).map(object =>
        this.projectWorldObject(object, .72, 'barrel')
      ),
      ...(objects.doors ?? []).map(object =>
        this.projectDoorway(object)
      )
    ].filter(Boolean).sort((a, b) => b.depth - a.depth);

    for (const object of projected) {
      if (object.type === 'crate') {
        this.drawCrate(ctx, object);
      } else if (object.type === 'barrel') {
        this.drawBarrel(ctx, object);
      } else {
        this.drawDoorway(ctx, object);
      }
    }
  }

  projectWorldObject(object, worldHeight, type) {
    const relative = worldToCamera(
      object,
      this.camera.position,
      this.camera.angle
    );

    if (relative.depth <= .1) return null;

    const halfFov = this.camera.fov * .5;
    if (Math.abs(relative.side / relative.depth) > Math.tan(halfFov)) {
      return null;
    }

    if (!this.raycaster.hasLineOfSight(this.camera.position, object)) {
      return null;
    }

    const projection = projectVerticalSegment(
      object,
      worldHeight,
      this.camera,
      this.canvas.width,
      this.canvas.height,
      this.getHorizon()
    );

    return {
      ...projection,
      type
    };
  }

  projectDoorway(door) {
    const relative = worldToCamera(
      door,
      this.camera.position,
      this.camera.angle
    );

    if (
      relative.depth <= .1 ||
      !this.raycaster.hasLineOfSight(this.camera.position, door)
    ) {
      return null;
    }

    const halfWidth = .5;
    const alongVerticalWall = door.orientation === 'vertical';
    const start = alongVerticalWall
      ? { x: door.x, y: door.y - halfWidth }
      : { x: door.x - halfWidth, y: door.y };
    const end = alongVerticalWall
      ? { x: door.x, y: door.y + halfWidth }
      : { x: door.x + halfWidth, y: door.y };
    const horizon = this.getHorizon();
    const project = (point, z) => projectPoint(
      { ...point, z },
      this.camera,
      this.canvas.width,
      this.canvas.height,
      horizon
    );

    return {
      type: 'door',
      depth: relative.depth,
      startBottom: project(start, 0),
      startTop: project(start, 1.1),
      endBottom: project(end, 0),
      endTop: project(end, 1.1)
    };
  }

  drawCrate(ctx, projected) {
    const width = Math.max(8, projected.height * .82);
    const depth = width * .22;
    const left = projected.x - width * .5;
    const top = projected.bottom - projected.height;

    ctx.save();
    ctx.fillStyle = '#020303';
    ctx.strokeStyle = 'rgba(238, 242, 238, .88)';
    ctx.lineWidth = 1;
    ctx.fillRect(left, top, width, projected.height);
    ctx.strokeRect(left, top, width, projected.height);
    ctx.beginPath();
    ctx.moveTo(left, top + depth);
    ctx.lineTo(left + depth, top);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left + width + depth, top + depth);
    ctx.lineTo(left + width, top + depth * 2);
    ctx.moveTo(left + width, top);
    ctx.lineTo(left + width, projected.bottom);
    ctx.lineTo(left + width + depth, projected.bottom - depth);
    ctx.lineTo(left + width + depth, top + depth);
    ctx.moveTo(left, top);
    ctx.lineTo(left + width, projected.bottom);
    ctx.moveTo(left + width, top);
    ctx.lineTo(left, projected.bottom);
    ctx.stroke();
    ctx.restore();
  }

  drawBarrel(ctx, projected) {
    const width = Math.max(7, projected.height * .54);
    const left = projected.x - width * .5;
    const top = projected.bottom - projected.height;
    const bandInset = projected.height * .24;

    ctx.save();
    ctx.fillStyle = '#020303';
    ctx.strokeStyle = 'rgba(238, 242, 238, .88)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + width * .2, top);
    ctx.lineTo(left + width * .8, top);
    ctx.lineTo(left + width, top + projected.height * .1);
    ctx.lineTo(left + width, projected.bottom - projected.height * .1);
    ctx.lineTo(left + width * .8, projected.bottom);
    ctx.lineTo(left + width * .2, projected.bottom);
    ctx.lineTo(left, projected.bottom - projected.height * .1);
    ctx.lineTo(left, top + projected.height * .1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      projected.x,
      top + projected.height * .1,
      width * .3,
      Math.max(2, projected.height * .06),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, top + bandInset);
    ctx.lineTo(left + width, top + bandInset);
    ctx.moveTo(left, projected.bottom - bandInset);
    ctx.lineTo(left + width, projected.bottom - bandInset);
    ctx.stroke();
    ctx.restore();
  }

  drawDoorway(ctx, projected) {
    ctx.save();
    ctx.strokeStyle = 'rgba(238, 242, 238, .82)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(projected.startBottom.x, projected.startBottom.y);
    ctx.lineTo(projected.startTop.x, projected.startTop.y);
    ctx.lineTo(projected.endTop.x, projected.endTop.y);
    ctx.lineTo(projected.endBottom.x, projected.endBottom.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(238, 242, 238, .38)';
    ctx.beginPath();
    ctx.moveTo(projected.startBottom.x + 3, projected.startBottom.y);
    ctx.lineTo(projected.startTop.x + 3, projected.startTop.y + 3);
    ctx.lineTo(projected.endTop.x - 3, projected.endTop.y + 3);
    ctx.lineTo(projected.endBottom.x - 3, projected.endBottom.y);
    ctx.stroke();
    ctx.restore();
  }

  projectEnemy(enemy) {
    const dx =
      enemy.position.x -
      this.camera.position.x;

    const dy =
      enemy.position.y -
      this.camera.position.y;

    const cameraAngle =
      this.camera.angle;

    const depth =
      dx * Math.cos(cameraAngle) +
      dy * Math.sin(cameraAngle);

    const side =
      -dx * Math.sin(cameraAngle) +
      dy * Math.cos(cameraAngle);

    if (depth <= 0.1) {
      return null;
    }

    const halfFov =
      this.camera.fov * 0.5;

    if (
      Math.abs(side / depth) >
      Math.tan(halfFov)
    ) {
      return null;
    }

    const horizon =
      this.getHorizon();

    const projection =
      projectVerticalSegment(
        enemy.position,
        enemy.dimensions?.height ?? 0.95,
        this.camera,
        this.canvas.width,
        this.canvas.height,
        horizon
      );

    if (!projection) {
      return null;
    }

    return {
      enemy,

      x: projection.x,

      top: projection.top,

      bottom: projection.bottom,

      height: projection.height,

      depth: projection.depth,

      side: projection.side,

      centerY:
        projection.top +
        projection.height * 0.5
    };
  }

  drawEnemy(ctx, projected) {
    const {
      enemy,
      x,
      top,
      bottom,
      height
    } = projected;

    const modelHeight = 42;

    const scale =
      height /
      modelHeight;

    const lineWidth =
      Math.max(
        2,
        Math.min(
          5,
          scale * 2.2
        )
      );

    const color =
      enemy.visualState?.hitFlash > 0
        ? '#ffffff'
        : enemy.visual?.outline ?? '#ff2f45';

    const centerX = x;
    const baseY = bottom;

    const walkPhase =
      enemy.visualState?.walkPhase ?? 0;

    const bob =
      enemy.state === 'CHASE'
        ? Math.sin(walkPhase * 2) *
          height *
          0.015
        : 0;

    ctx.save();

    ctx.strokeStyle = color;
    ctx.fillStyle =
      enemy.visual?.fill ??
      '#050606';

    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';

    const headWidth =
      11 * scale;

    const headHeight =
      10 * scale;

    const headX =
      centerX -
      headWidth * 0.5;

    const headY =
      baseY -
      height +
      1 * scale +
      bob;

    ctx.fillRect(
      headX,
      headY,
      headWidth,
      headHeight
    );

    ctx.strokeRect(
      headX,
      headY,
      headWidth,
      headHeight
    );

    const neckWidth =
      4 * scale;

    const neckTop =
      headY +
      headHeight;

    const neckBottom =
      neckTop +
      3 * scale;

    ctx.beginPath();

    ctx.moveTo(
      centerX - neckWidth * 0.5,
      neckTop
    );

    ctx.lineTo(
      centerX - neckWidth * 0.5,
      neckBottom
    );

    ctx.moveTo(
      centerX + neckWidth * 0.5,
      neckTop
    );

    ctx.lineTo(
      centerX + neckWidth * 0.5,
      neckBottom
    );

    ctx.stroke();

    const shoulderWidth =
      24 * scale;

    const shoulderY =
      neckBottom;

    ctx.beginPath();

    ctx.moveTo(
      centerX -
        shoulderWidth * 0.5,
      shoulderY
    );

    ctx.lineTo(
      centerX +
        shoulderWidth * 0.5,
      shoulderY
    );

    ctx.stroke();

    const torsoTopWidth =
      17 * scale;

    const torsoBottomWidth =
      13 * scale;

    const torsoHeight =
      13 * scale;

    const torsoTopY =
      shoulderY +
      1 * scale;

    const torsoBottomY =
      torsoTopY +
      torsoHeight;

    ctx.beginPath();

    ctx.moveTo(
      centerX -
        torsoTopWidth * 0.5,
      torsoTopY
    );

    ctx.lineTo(
      centerX +
        torsoTopWidth * 0.5,
      torsoTopY
    );

    ctx.lineTo(
      centerX +
        torsoBottomWidth * 0.5,
      torsoBottomY
    );

    ctx.lineTo(
      centerX -
        torsoBottomWidth * 0.5,
      torsoBottomY
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    const armThickness =
      Math.max(
        2,
        3.2 * scale
      );

    const armStartY =
      shoulderY +
      1 * scale;

    const armEndY =
      torsoBottomY -
      1 * scale;

    const armOffset =
      shoulderWidth *
      0.5;

    ctx.lineWidth = armThickness;

    ctx.beginPath();

    ctx.moveTo(
      centerX - armOffset,
      armStartY
    );

    ctx.lineTo(
      centerX -
        14 * scale,
      armEndY +
        4 * scale
    );

    ctx.moveTo(
      centerX + armOffset,
      armStartY
    );

    ctx.lineTo(
      centerX +
        14 * scale,
      armEndY +
        4 * scale
    );

    ctx.stroke();

    const handSize =
      2.5 * scale;

    ctx.fillRect(
      centerX -
        14 * scale -
        handSize * 0.5,
      armEndY +
        4 * scale -
        handSize * 0.5,
      handSize,
      handSize
    );

    ctx.fillRect(
      centerX +
        14 * scale -
        handSize * 0.5,
      armEndY +
        4 * scale -
        handSize * 0.5,
      handSize,
      handSize
    );

    const hipWidth =
      14 * scale;

    const hipHeight =
      4 * scale;

    const hipY =
      torsoBottomY;

    ctx.fillRect(
      centerX -
        hipWidth * 0.5,
      hipY,
      hipWidth,
      hipHeight
    );

    ctx.strokeRect(
      centerX -
        hipWidth * 0.5,
      hipY,
      hipWidth,
      hipHeight
    );

    const legThickness =
      Math.max(
        2.5,
        3.4 * scale
      );

    const legTopY =
      hipY +
      hipHeight;

    const legBottomY =
      baseY -
      2 * scale +
      bob;

    const legOffset =
      4 * scale;

    ctx.lineWidth = legThickness;

    ctx.beginPath();

    ctx.moveTo(
      centerX - legOffset,
      legTopY
    );

    ctx.lineTo(
      centerX - legOffset,
      legBottomY
    );

    ctx.moveTo(
      centerX + legOffset,
      legTopY
    );

    ctx.lineTo(
      centerX + legOffset,
      legBottomY
    );

    ctx.stroke();

    const footWidth =
      5 * scale;

    const footHeight =
      2.5 * scale;

    ctx.fillRect(
      centerX -
        legOffset -
        footWidth * 0.5,
      legBottomY -
        footHeight * 0.5,
      footWidth,
      footHeight
    );

    ctx.fillRect(
      centerX +
        legOffset -
        footWidth * 0.5,
      legBottomY -
        footHeight * 0.5,
      footWidth,
      footHeight
    );

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
      centerX -
        9 * scale,
      baseY
    );

    ctx.lineTo(
      centerX +
        9 * scale,
      baseY
    );

    ctx.stroke();

    ctx.restore();
  }

  drawRadar(ctx, canvas, enemies) {
    const radius = Math.min(52, canvas.width * .07);
    const center = { x: canvas.width - radius - 30, y: radius + 28 };
    ctx.save();
    ctx.strokeStyle = 'rgba(233, 240, 232, .68)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.moveTo(center.x - radius, center.y);
    ctx.lineTo(center.x + radius, center.y);
    ctx.moveTo(center.x, center.y - radius);
    ctx.lineTo(center.x, center.y + radius);
    ctx.stroke();
    ctx.fillStyle = COLORS.WALL ?? '#b9d5bf';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y - 9);
    ctx.lineTo(center.x - 6, center.y + 7);
    ctx.lineTo(center.x + 6, center.y + 7);
    ctx.closePath();
    ctx.fill();
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.position.x - this.camera.position.x;
      const dy = enemy.position.y - this.camera.position.y;
      const scale = radius / 7;
      const ex = center.x + (-dx * Math.sin(this.camera.angle) + dy * Math.cos(this.camera.angle)) * scale;
      const ey = center.y - (dx * Math.cos(this.camera.angle) + dy * Math.sin(this.camera.angle)) * scale;
      if (Math.hypot(ex - center.x, ey - center.y) >= radius) continue;
      ctx.fillStyle = COLORS.ENEMY ?? '#ff334c';
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
    }
    ctx.restore();
  }
}
