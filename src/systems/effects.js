export class Effects {
  constructor() { this.flashTime = 0; this.kind = ''; this.tracerTime = 0; this.deathBursts = []; }
  flash(kind) { this.kind = kind; this.flashTime = .12; if (kind === 'shot') this.tracerTime = .08; }
  death(position) { this.deathBursts.push({ position: { ...position }, time: .22 }); }
  update(dt) { this.flashTime = Math.max(0, this.flashTime - dt); this.tracerTime = Math.max(0, this.tracerTime - dt); for (const burst of this.deathBursts) burst.time -= dt; this.deathBursts = this.deathBursts.filter(burst => burst.time > 0); }
  draw(ctx, canvas) {
    if (this.tracerTime > 0) { ctx.strokeStyle = '#fff4db'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(canvas.width / 2, canvas.height * .63); ctx.lineTo(canvas.width / 2, canvas.height * .47); ctx.stroke(); }
    if (this.flashTime > 0) { ctx.strokeStyle = this.kind === 'hit' ? '#fff4db' : '#ffcf7a'; ctx.lineWidth = 2; const size = this.kind === 'hit' ? 12 : 8 + (1 - this.flashTime / .12) * 8; const x = canvas.width / 2; const y = canvas.height * .55; ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke(); }
    for (const burst of this.deathBursts) { const size = (1 - burst.time / .22) * 18; const x = canvas.width / 2; const y = canvas.height / 2; ctx.strokeStyle = `rgba(255, 64, 61, ${burst.time / .22})`; ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke(); }
  }
}