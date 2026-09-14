export class Weapon {
	constructor(config, audio) { this.config = config; this.audio = audio; this.ammo = config.magazine; this.reserve = config.reserve; this.cooldown = 0; this.reloadTimer = 0; this.reloading = false; this.recoil = 0; this.shot = 0; this.muzzleFlash = 0; this.tracer = 0; }
	update(dt) { this.cooldown = Math.max(0, this.cooldown - dt * 1000); this.recoil = Math.max(0, this.recoil - dt * 5); this.shot = Math.max(0, this.shot - dt); this.muzzleFlash = Math.max(0, this.muzzleFlash - dt); this.tracer = Math.max(0, this.tracer - dt); if (this.reloading && (this.reloadTimer -= dt * 1000) <= 0) { const needed = this.config.magazine - this.ammo; const loaded = Math.min(needed, this.reserve); this.ammo += loaded; this.reserve -= loaded; this.reloading = false; } }
	reload() { if (!this.reloading && this.ammo < this.config.magazine && this.reserve > 0) { this.reloading = true; this.reloadTimer = this.config.reloadTime; this.recoil = 1; this.audio.play('reload'); } }
	canFire() { return !this.reloading && this.ammo > 0 && this.cooldown === 0; }
	fire() { if (!this.canFire()) return false; this.ammo--; this.cooldown = this.config.fireRate; this.recoil = 1; this.shot = .12; this.muzzleFlash = .06; this.tracer = .04; this.audio.play('shoot'); return true; }
	render(ctx, width, height) {
		const scale = Math.min(width, height) / 540;
		const reloadProgress = this.reloading ? 1 - this.reloadTimer / this.config.reloadTime : 0;
		const reloadMotion = Math.sin(reloadProgress * Math.PI);
		const recoilOffset = this.recoil * 12;
		ctx.save();
		ctx.translate(width * .72, height * .85 + recoilOffset + reloadMotion * 10);
		ctx.rotate(.95 + reloadMotion * -.1);
		ctx.scale(scale * .65, scale * .65);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.lineWidth = 3;
		ctx.strokeStyle = '#e9f0e8';
		ctx.fillStyle = '#080b0b';
		this.drawStock(ctx);
		this.drawReceiver(ctx);
		this.drawHandguard(ctx);
		this.drawBarrel(ctx);
		this.drawMagazine(ctx);
		this.drawGrip(ctx);
		this.drawSight(ctx);
		if (this.tracer > 0) this.drawTracer(ctx);
		if (this.muzzleFlash > 0) this.drawMuzzleFlash(ctx);
		ctx.restore();
	}
	drawStock(ctx) { ctx.beginPath(); ctx.moveTo(55, 12); ctx.lineTo(150, 22); ctx.lineTo(190, 5); ctx.lineTo(172, 48); ctx.lineTo(72, 38); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(150, 22); ctx.lineTo(205, 30); ctx.lineTo(210, 54); ctx.lineTo(172, 48); ctx.stroke(); }
	drawReceiver(ctx) { ctx.beginPath(); ctx.moveTo(-72, -38); ctx.lineTo(55, -45); ctx.lineTo(75, 15); ctx.lineTo(-58, 28); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-55, -22); ctx.lineTo(42, -28); ctx.lineTo(50, -8); ctx.lineTo(-47, 0); ctx.stroke(); }
	drawHandguard(ctx) { ctx.beginPath(); ctx.moveTo(-205, -28); ctx.lineTo(-72, -38); ctx.lineTo(-58, 0); ctx.lineTo(-190, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let y = -18; y < 2; y += 10) { ctx.beginPath(); ctx.moveTo(-184, y); ctx.lineTo(-82, y - 8); ctx.stroke(); } }
	drawBarrel(ctx) { ctx.beginPath(); ctx.moveTo(-335, -42); ctx.lineTo(-202, -39); ctx.lineTo(-202, -13); ctx.lineTo(-335, -15); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-350, -48); ctx.lineTo(-334, -48); ctx.lineTo(-334, -9); ctx.lineTo(-350, -9); ctx.closePath(); ctx.stroke(); }
	drawMagazine(ctx) { ctx.beginPath(); ctx.moveTo(-28, 18); ctx.quadraticCurveTo(20, 52, 18, 128); ctx.lineTo(-18, 145); ctx.quadraticCurveTo(-12, 72, -57, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-23, 42); ctx.quadraticCurveTo(4, 68, 2, 114); ctx.stroke(); }
	drawGrip(ctx) { ctx.beginPath(); ctx.moveTo(28, 12); ctx.lineTo(76, 8); ctx.lineTo(66, 92); ctx.lineTo(30, 104); ctx.closePath(); ctx.fill(); ctx.stroke(); }
	drawSight(ctx) { ctx.beginPath(); ctx.moveTo(-150, -35); ctx.lineTo(-143, -58); ctx.lineTo(-127, -58); ctx.lineTo(-119, -35); ctx.moveTo(18, -43); ctx.lineTo(25, -63); ctx.lineTo(39, -63); ctx.lineTo(45, -44); ctx.stroke(); }
	drawTracer(ctx) { ctx.strokeStyle = '#fff4db'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-350, -28); ctx.lineTo(-315, -28); ctx.stroke(); }
	drawMuzzleFlash(ctx) { const x = -350; const y = -28; ctx.strokeStyle = '#ffcf7a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y - 12); ctx.moveTo(x, y); ctx.lineTo(x - 28, y); ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 12); ctx.moveTo(x, y); ctx.lineTo(x - 15, y - 18); ctx.moveTo(x, y); ctx.lineTo(x - 15, y + 18); ctx.stroke(); }
}