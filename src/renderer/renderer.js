import { COLORS } from '../config/constants.js';
import { wallHeight, screenX } from './projection.js';

export class Renderer {
  constructor(canvas, camera, raycaster, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.raycaster = raycaster;
    this.ui = ui;
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = Math.max(480, Math.min(960, innerWidth));
    this.canvas.height = Math.max(270, Math.min(540, innerHeight));
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
    const rays = Math.min(canvas.width, 480);
    const horizon = this.getHorizon();
    ctx.fillStyle = '#020303';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawAtmosphere(ctx, canvas);
    this.drawPerspectiveFloor(ctx, canvas, horizon);
    const hits = this.raycaster.cast(this.camera, rays);
    this.drawWalls(ctx, canvas, hits, rays);
    this.drawWallContours(ctx, canvas, hits, rays);
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
    const centerX = canvas.width * .5;
    ctx.save();
    ctx.strokeStyle = 'rgba(233, 240, 232, .16)';
    ctx.lineWidth = 1;
    for (const step of [.58, .68, .8, .92]) {
      const y = horizon + (canvas.height - horizon) * ((step - .5) / .5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (const lane of [-2, -1, 1, 2]) {
      ctx.beginPath();
      ctx.moveTo(centerX, horizon);
      ctx.lineTo(centerX + lane * canvas.width * .19, canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawWalls(ctx, canvas, hits, rays) {
    const columnWidth = canvas.width / rays;
    for (let index = 0; index < rays; index++) {
      const hit = hits[index];
      if (!hit) continue;
      const x = screenX(index, canvas.width, rays);
      const height = wallHeight(hit.distance, canvas.height);
      const top = horizon - height * .5;
      const shade = Math.max(.015, Math.min(.08, hit.shade * .06));
      ctx.fillStyle = `rgba(220, 230, 222, ${shade})`;
      ctx.fillRect(x, top, columnWidth + 1, height);
    }
  }

  drawWallContours(ctx, canvas, hits, rays) {
    const horizon = this.getHorizon();
    const topPoints = [];
    const bottomPoints = [];
    for (let index = 0; index < rays; index += 6) {
      const hit = hits[index];
      if (!hit) continue;
      const x = screenX(index, canvas.width, rays);
      const height = wallHeight(hit.distance, canvas.height);
      topPoints.push({ x, y: horizon - height * .5 });
      bottomPoints.push({ x, y: horizon + height * .5 });
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(233, 240, 232, .76)';
    ctx.lineWidth = 1;
    this.drawPolyline(ctx, topPoints);
    this.drawPolyline(ctx, bottomPoints);
    ctx.strokeStyle = 'rgba(233, 240, 232, .3)';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(canvas.width, horizon);
    ctx.stroke();
    ctx.restore();
  }

  drawPolyline(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
    ctx.stroke();
  }

  projectEnemy(enemy) {
    const dx = enemy.position.x - this.camera.position.x;
    const dy = enemy.position.y - this.camera.position.y;
    const angle = this.camera.angle;
    const depth = dx * Math.cos(angle) + dy * Math.sin(angle);
    const side = -dx * Math.sin(angle) + dy * Math.cos(angle);
    if (depth <= .1) return null;
    const halfFov = this.camera.fov * .5;
    if (Math.abs(side / depth) > Math.tan(halfFov)) return null;
    const focalLength = this.canvas.width / (2 * Math.tan(halfFov));
    const x = this.canvas.width * .5 + side / depth * focalLength;
    const dimensions = enemy.dimensions ?? { width: .42, height: .95, depth: .28 };
    const projectedHeight = dimensions.height / Math.max(depth, .001) * focalLength * (enemy.visualScale ?? 1);
    const height = Math.max(20, Math.min(this.canvas.height * 1.25, projectedHeight));
    const worldHeight = Math.max(.01, dimensions.height);
    const feetOffset = ((this.camera.height ?? .5) / worldHeight - .5) * height;
    const bottom = this.getHorizon() + feetOffset + height * .5;
    return { enemy, x, depth, top: bottom - height, bottom, height, centerY: bottom - height * .5 };
  }

  drawEnemy(ctx, projected) {
    const { enemy, x, top, bottom, height } = projected;
    const humanoid = enemy.humanoid ?? { head: { width: .22, height: .2, depth: .18, y: .8 }, torso: { width: .3, height: .32, y: .49 }, shoulders: { width: .38, y: .63 }, arms: { thickness: .07, shoulderY: .62, handY: .42 }, legs: { thickness: .08, hipY: .34, footY: .05, separation: .1 } };
    const scale = height / Math.max(.01, enemy.dimensions?.height ?? .95);
    const localY = value => bottom - value * scale;
    const color = enemy.visualState?.hitFlash > 0 ? '#fff' : enemy.visual?.outline ?? COLORS.ENEMY ?? '#ff334c';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = enemy.visual?.fill ?? 'rgba(5, 6, 6, .92)';
    ctx.lineWidth = Math.max(1.5, Math.min(5, scale * .035));
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    const headWidth = humanoid.head.width * scale;
    const headHeight = humanoid.head.height * scale;
    const headY = localY(humanoid.head.y);
    ctx.fillRect(x - headWidth * .5, headY, headWidth, headHeight);
    ctx.strokeRect(x - headWidth * .5, headY, headWidth, headHeight);
    const torsoWidth = humanoid.torso.width * scale;
    const torsoHeight = humanoid.torso.height * scale;
    const torsoTop = localY(humanoid.torso.y + humanoid.torso.height);
    ctx.fillRect(x - torsoWidth * .5, torsoTop, torsoWidth, torsoHeight);
    ctx.strokeRect(x - torsoWidth * .5, torsoTop, torsoWidth, torsoHeight);
    const shoulderWidth = humanoid.shoulders.width * scale;
    const shoulderY = localY(humanoid.shoulders.y);
    ctx.beginPath();
    ctx.moveTo(x - shoulderWidth * .5, shoulderY);
    ctx.lineTo(x + shoulderWidth * .5, shoulderY);
    ctx.stroke();
    const armSpread = shoulderWidth * .5;
    ctx.lineWidth = Math.max(ctx.lineWidth, humanoid.arms.thickness * scale);
    ctx.beginPath();
    ctx.moveTo(x - armSpread, localY(humanoid.arms.shoulderY));
    ctx.lineTo(x - armSpread - humanoid.arms.thickness * scale * 1.5, localY(humanoid.arms.handY));
    ctx.moveTo(x + armSpread, localY(humanoid.arms.shoulderY));
    ctx.lineTo(x + armSpread + humanoid.arms.thickness * scale * 1.5, localY(humanoid.arms.handY));
    ctx.stroke();
    const legOffset = humanoid.legs.separation * scale * .5;
    ctx.lineWidth = Math.max(ctx.lineWidth, humanoid.legs.thickness * scale);
    ctx.beginPath();
    ctx.moveTo(x - legOffset, localY(humanoid.legs.hipY));
    ctx.lineTo(x - legOffset, localY(humanoid.legs.footY));
    ctx.moveTo(x + legOffset, localY(humanoid.legs.hipY));
    ctx.lineTo(x + legOffset, localY(humanoid.legs.footY));
    ctx.stroke();
    const walkPhase = enemy.visualState?.walkPhase ?? 0;
    if (enemy.state === 'CHASE' && Math.abs(Math.sin(walkPhase)) > .05) {
      const swing = Math.sin(walkPhase) * height * .035;
      ctx.beginPath();
      ctx.moveTo(x - legOffset, localY(humanoid.legs.hipY));
      ctx.lineTo(x - legOffset - swing, localY(humanoid.legs.footY));
      ctx.moveTo(x + legOffset, localY(humanoid.legs.hipY));
      ctx.lineTo(x + legOffset + swing, localY(humanoid.legs.footY));
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - height * .08, bottom);
    ctx.lineTo(x + height * .08, bottom);
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
