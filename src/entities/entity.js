/**
 * Base entity used by gameplay objects that exist in the world.
 *
 * This class intentionally contains no rendering code.
 * Rendering remains the responsibility of the renderer layer.
 */
export class Entity {
	constructor(position, health = 1) {
		this.position = {
			x: Number(position?.x) || 0,
			y: Number(position?.y) || 0
		};

		this.health = Math.max(0, Number(health) || 0);

		this.dead = this.health <= 0;
		this.state = this.dead ? 'DEAD' : 'IDLE';

		// World-space orientation in radians.
		this.facing = 0;

		// Generic collision radius.
		this.radius = 0.22;

		// Generic world dimensions.
		//
		// These values are intentionally separated from rendering so
		// each concrete entity can adapt them without changing the
		// renderer contract.
		this.dimensions = {
			width: 0.44,
			height: 1.00,
			depth: 0.30
		};

		// Normalized visual scale.
		//
		// The renderer can use this to project the entity without
		// hardcoding individual scale values.
		this.visualScale = 1;

		// Generic visual profile.
		//
		// Enemy-specific files may override these values later.
		this.visual = {
			color: '#ff3030',
			outline: '#ff3030',
			fill: 'rgba(8, 8, 8, 0.92)',
			lineWidth: 1
		};
	}

	isAlive() {
		return !this.dead && this.health > 0;
	}

	isDead() {
		return this.dead;
	}

	setPosition(x, y) {
		this.position.x = Number(x) || 0;
		this.position.y = Number(y) || 0;
	}

	setFacing(angle) {
		this.facing = Number.isFinite(angle) ? angle : 0;
	}

	takeDamage(amount) {
		if (this.dead) {
			return false;
		}

		const damage = Math.max(0, Number(amount) || 0);

		if (damage === 0) {
			return false;
		}

		this.health = Math.max(0, this.health - damage);

		if (this.health <= 0) {
			this.health = 0;
			this.dead = true;
			this.state = 'DEAD';
		}

		return true;
	}

	kill() {
		this.health = 0;
		this.dead = true;
		this.state = 'DEAD';
	}

	reset(position = this.position, health = this.health) {
		this.position = {
			x: Number(position?.x) || 0,
			y: Number(position?.y) || 0
		};

		this.health = Math.max(0, Number(health) || 0);
		this.dead = this.health <= 0;
		this.state = this.dead ? 'DEAD' : 'IDLE';
	}
}