export class Weapon {
	constructor(config, audio) { this.config = config; this.audio = audio; this.ammo = config.magazine; this.reserve = config.reserve; this.cooldown = 0; this.reloadTimer = 0; this.reloading = false; this.recoil = 0; this.shot = 0; }
	update(dt) { this.cooldown = Math.max(0, this.cooldown - dt * 1000); this.recoil = Math.max(0, this.recoil - dt * 5); this.shot = Math.max(0, this.shot - dt); if (this.reloading && (this.reloadTimer -= dt * 1000) <= 0) { const needed = this.config.magazine - this.ammo; const loaded = Math.min(needed, this.reserve); this.ammo += loaded; this.reserve -= loaded; this.reloading = false; } }
	reload() { if (!this.reloading && this.ammo < this.config.magazine && this.reserve > 0) { this.reloading = true; this.reloadTimer = this.config.reloadTime; this.recoil = 1; this.audio.play('reload'); } }
	canFire() { return !this.reloading && this.ammo > 0 && this.cooldown === 0; }
	fire() { if (!this.canFire()) return false; this.ammo--; this.cooldown = this.config.fireRate; this.recoil = 1; this.shot = .12; this.audio.play('shoot'); return true; }
}