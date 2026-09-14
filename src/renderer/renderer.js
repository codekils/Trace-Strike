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
    this.canvas.width = Math.min(960, Math.max(480, innerWidth));
    this.canvas.height = Math.min(540, Math.max(270, innerHeight));
  }

  render(world, enemies, effects, weapon) {
    const { ctx, canvas } = this;
    const rays = Math.min(canvas.width, 480);
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawPerspectiveFloor(ctx, canvas);
    const hits = this.raycaster.cast(this.camera, rays);
    for (let index = 0; index < rays; index++) {
      const hit = hits[index];
      const height = wallHeight(hit.distance, canvas.height);
      const x = screenX(index, canvas.width, rays);
      const top = (canvas.height - height) / 2;
      ctx.fillStyle = `rgba(185, 213, 191, ${Math.min(.16, hit.shade * .12)})`;
      ctx.fillRect(x, top, canvas.width / rays + 1, height);
      if (index % 24 === 0) {
        ctx.strokeStyle = `rgba(233, 240, 232, ${.16 + hit.shade * .34})`;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, top + height);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(233, 240, 232, .72)';
    ctx.lineWidth = 1;
    for (let index = 0; index < rays; index += 12) {
      const hit = hits[index];
      const x = screenX(index, canvas.width, rays);
      const height = wallHeight(hit.distance, canvas.height);
      ctx.beginPath();
      ctx.moveTo(x, (canvas.height - height) / 2);
      ctx.lineTo(x + canvas.width / rays * 8, (canvas.height - height) / 2);
      ctx.moveTo(x, (canvas.height + height) / 2);
      ctx.lineTo(x + canvas.width / rays * 8, (canvas.height + height) / 2);
      ctx.stroke();
    }
    const visible = enemies.filter(enemy => !enemy.dead && this.raycaster.hasLineOfSight(this.camera.position, enemy.position)).map(enemy => this.projectEnemy(enemy)).filter(Boolean).sort((a, b) => b.depth - a.depth);
    for (const enemy of visible) this.drawEnemy(ctx, enemy);
    weapon?.render(ctx, canvas.width, canvas.height);
    this.drawRadar(ctx, canvas, enemies);
    effects.draw(ctx, canvas);
    this.ui.drawCrosshair(ctx, canvas, weapon?.shot > 0);
  }

  drawPerspectiveFloor(ctx, canvas) {
    const horizon = canvas.height / 2;
    ctx.strokeStyle = 'rgba(185, 213, 191, .16)';
    ctx.lineWidth = 1;
    for (let step = 1; step < 7; step++) {
      const y = horizon + (canvas.height / 2) * (step / 7) ** .72;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    for (let lane = -5; lane <= 5; lane++) {
      ctx.beginPath(); ctx.moveTo(canvas.width / 2, horizon); ctx.lineTo(canvas.width / 2 + lane * canvas.width * .22, canvas.height); ctx.stroke();
    }
  }

  drawEnemy(ctx, enemy) {
    const size = Math.max(24, Math.min(this.canvas.height * 1.1, this.canvas.height / enemy.depth * .65));
    const x = enemy.x;
    const y = this.canvas.height / 2;
    ctx.strokeStyle = COLORS.ENEMY;
    ctx.lineWidth = Math.max(2, size * .045);
    ctx.fillStyle = 'rgba(5, 6, 6, .88)';
    ctx.fillRect(x - size * .14, y - size * .44, size * .28, size * .25);
    ctx.strokeRect(x - size * .14, y - size * .44, size * .28, size * .25);
    ctx.fillRect(x - size * .22, y - size * .17, size * .44, size * .4);
    ctx.strokeRect(x - size * .22, y - size * .17, size * .44, size * .4);
    ctx.beginPath();
    ctx.moveTo(x, y - size * .18); ctx.lineTo(x, y + size * .22);
    ctx.moveTo(x - size * .26, y - size * .05); ctx.lineTo(x + size * .26, y - size * .05);
    ctx.moveTo(x, y + size * .22); ctx.lineTo(x - size * .2, y + size * .5);
    ctx.moveTo(x, y + size * .22); ctx.lineTo(x + size * .2, y + size * .5);
    ctx.stroke();
  }

  drawRadar(ctx, canvas, enemies) {
    const radius = Math.min(58, canvas.width * .08);
    const center = { x: canvas.width - radius - 28, y: radius + 26 };
    ctx.strokeStyle = 'rgba(233, 240, 232, .7)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.moveTo(center.x - radius, center.y); ctx.lineTo(center.x + radius, center.y);
    ctx.moveTo(center.x, center.y - radius); ctx.lineTo(center.x, center.y + radius); ctx.stroke();
    ctx.fillStyle = '#b9d5bf';
    ctx.beginPath(); ctx.moveTo(center.x, center.y - 8); ctx.lineTo(center.x - 6, center.y + 7); ctx.lineTo(center.x + 6, center.y + 7); ctx.closePath(); ctx.fill();
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.position.x - this.camera.position.x;
      const dy = enemy.position.y - this.camera.position.y;
      const scale = radius / 7;
      const ex = center.x + (-dx * Math.sin(this.camera.angle) + dy * Math.cos(this.camera.angle)) * scale;
      const ey = center.y - (dx * Math.cos(this.camera.angle) + dy * Math.sin(this.camera.angle)) * scale;
      if (Math.hypot(ex - center.x, ey - center.y) < radius) { ctx.fillStyle = COLORS.ENEMY; ctx.fillRect(ex - 3, ey - 3, 6, 6); }
    }
  }

  projectEnemy(enemy) {
    const dx = enemy.position.x - this.camera.position.x;
    const dy = enemy.position.y - this.camera.position.y;
    const depth = dx * Math.cos(this.camera.angle) + dy * Math.sin(this.camera.angle);
    const side = -dx * Math.sin(this.camera.angle) + dy * Math.cos(this.camera.angle);
    if (depth <= .1 || Math.abs(side / depth) > Math.tan(this.camera.fov / 2)) return null;
    return { x: this.canvas.width / 2 + side / depth * this.canvas.width / (2 * Math.tan(this.camera.fov / 2)), depth };
  }
}