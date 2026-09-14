import { Entity } from './entity.js';
import { ENEMIES } from '../config/enemies.js';

export class Enemy extends Entity {
	constructor(position) {
		super(position, ENEMIES.sentinel.health);

		this.speed = ENEMIES.sentinel.speed;
		this.damage = ENEMIES.sentinel.damage;
		this.attackRange = ENEMIES.sentinel.attackRange;
		this.attackCooldown = 0;

		this.radius = ENEMIES.sentinel.radius;

		// World-space dimensions of the humanoid.
		this.dimensions = {
			width: 0.42,
			height: 0.72,
			depth: 0.28
		};

		this.visualScale = 1;

		// Geometry profile consumed later by the renderer.
		//
		// Coordinates are local to the enemy:
		// x = horizontal
		// y = vertical
		// z = depth
		//
		// No Canvas/rendering logic belongs in this class.
		this.humanoid = {
			head: {
				width: 0.22,
				height: 0.20,
				depth: 0.18,
				y: 0.80
			},

			torso: {
				width: 0.30,
				height: 0.32,
				depth: 0.20,
				y: 0.49
			},

			shoulders: {
				width: 0.38,
				y: 0.63
			},

			arms: {
				length: 0.30,
				thickness: 0.07,
				shoulderY: 0.62,
				handY: 0.42
			},

			legs: {
				length: 0.30,
				thickness: 0.08,
				hipY: 0.34,
				footY: 0.05,
				separation: 0.10
			}
		};

		// Visual identity used by the renderer.
		this.visual = {
			color: '#ff2f45',
			outline: '#ff2f45',
			fill: 'rgba(8, 8, 8, 0.92)',
			lineWidth: 2
		};

		// Small geometric state used later for animation.
		this.visualState = {
			bob: 0,
			walkPhase: 0,
			hitFlash: 0
		};
	}

	update(dt) {
		this.attackCooldown = Math.max(
			0,
			this.attackCooldown - dt * 1000
		);

		this.visualState.hitFlash = Math.max(
			0,
			this.visualState.hitFlash - dt
		);
	}

	canAttack() {
		return (
			this.isAlive() &&
			this.attackCooldown <= 0
		);
	}

	triggerAttackCooldown() {
		this.attackCooldown = ENEMIES.sentinel.attackCooldown;
	}

	registerHit() {
		if (this.dead) {
			return;
		}

		this.visualState.hitFlash = 0.08;
	}

	setWalking(isWalking, dt) {
		if (!isWalking) {
			return;
		}

		this.visualState.walkPhase += dt * 7;
	}
}