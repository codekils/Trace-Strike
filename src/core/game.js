import { State } from './state.js';
import { GAME_STATES } from '../config/constants.js';
import { World } from '../world/world.js';
import { SPAWN } from '../world/map.js';
import { Player } from '../player/player.js';
import { Weapon } from '../player/weapon.js';
import { Camera } from '../renderer/camera.js';
import { Raycaster } from '../renderer/raycaster.js';
import { Renderer } from '../renderer/renderer.js';
import { Enemy } from '../entities/enemy.js';
import { updateEnemyAI } from '../entities/enemyAI.js';
import { shoot, enemyAttack } from '../systems/combat.js';
import { Effects } from '../systems/effects.js';
import { WEAPONS } from '../config/weapons.js';
import { SETTINGS } from '../config/settings.js';
export class Game { constructor(canvas, input, ui, audio) { this.state = new State(); this.input = input; this.ui = ui; this.audio = audio; this.canvas = canvas; this.effects = new Effects(); this.menu = ui.menu; this.pause = ui.pause; this.over = ui.over; this.bindUI(); this.reset(); }
  reset() { this.world = new World(); this.player = new Player(SPAWN); this.weapon = new Weapon(WEAPONS.sidearm, this.audio); this.enemies = this.world.enemies.map(spawn => new Enemy(spawn)); this.camera = new Camera(this.player); this.renderer = new Renderer(this.canvas, this.camera, new Raycaster(this.world), this.ui.hud); }
  bindUI() { this.menuStart = () => { this.audio.unlock(); this.reset(); this.state.set(GAME_STATES.PLAYING); this.menu.hide(); this.pause.hide(); this.over.hidden = true; this.ui.hud.element.hidden = false; try { const lock = this.canvas.requestPointerLock?.(); lock?.catch(() => {}); } catch (_) {} }; this.menu.element.querySelector('#start-button').onclick = this.menuStart; this.pause.element.querySelector('#resume-button').onclick = () => { this.state.set(GAME_STATES.PLAYING); this.pause.hide(); }; this.over.querySelector('#restart-button').onclick = this.menuStart; }
  update(dt) { if (!this.state.is(GAME_STATES.PLAYING)) return; this.player.update(dt, this.input, this.world); this.weapon.update(dt); if (this.input.isDown('KeyR')) this.weapon.reload(); if (this.input.mouse.pressed) shoot(this.player, this.weapon, this.enemies, this.world, this.effects, this.audio); for (const enemy of this.enemies) { enemy.update(dt); updateEnemyAI(enemy, this.player, this.world, dt); if (enemy.state === 'ATTACK') enemyAttack(enemy, this.player, enemy.damage, this.audio); } this.effects.update(dt); if (this.player.health <= 0) { this.player.dead = true; this.state.set(GAME_STATES.GAME_OVER); this.over.hidden = false; document.exitPointerLock?.(); } if (this.input.isDown('Escape')) { this.state.set(GAME_STATES.PAUSED); this.pause.show(); } this.ui.hud.update(this.player, this.weapon, this.enemies, SETTINGS.sector); }
  render() { if (this.state.is(GAME_STATES.MENU)) return; this.renderer.render(this.world, this.enemies, this.effects); }
}