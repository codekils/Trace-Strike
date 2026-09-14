import { distance, normalizeAngle } from '../world/geometry.js';
import { moveWithCollision } from '../world/collision.js';

const AI_CONFIG = Object.freeze({
	detectionRange: 7,
	attackDistance: 1.2,
	movementThreshold: 0.015,
	idleFacingSpeed: 1.2
});

function getDirection(from, to) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;

	return {
		x: dx,
		y: dy,
		length: Math.hypot(dx, dy),
		angle: Math.atan2(dy, dx)
	};
}

export function updateEnemyAI(enemy, player, world, dt) {
	if (!enemy || enemy.dead) {
		if (enemy) {
			enemy.state = 'DEAD';
			enemy.visualState?.hitFlash;
		}

		return;
	}

	const deltaTime = Math.max(0, Number(dt) || 0);

	const direction = getDirection(
		enemy.position,
		player.position
	);

	const gap = direction.length;

	enemy.facing = normalizeAngle(direction.angle);

	if (gap <= AI_CONFIG.attackDistance) {
		enemy.state = 'ATTACK';
	} else if (gap <= AI_CONFIG.detectionRange) {
		enemy.state = 'CHASE';
	} else {
		enemy.state = 'PATROL';
	}

	if (enemy.state === 'CHASE') {
		const moveX =
			Math.cos(direction.angle) *
			enemy.speed *
			deltaTime;

		const moveY =
			Math.sin(direction.angle) *
			enemy.speed *
			deltaTime;

		if (
			Math.abs(moveX) > AI_CONFIG.movementThreshold ||
			Math.abs(moveY) > AI_CONFIG.movementThreshold
		) {
			moveWithCollision(
				enemy.position,
				moveX,
				moveY,
				world,
				enemy.radius
			);

			enemy.setWalking?.(true, deltaTime);
		}
	} else {
		enemy.setWalking?.(false, deltaTime);
	}

	if (enemy.state === 'ATTACK' && enemy.canAttack?.()) {
		enemy.triggerAttackCooldown?.();
	}

	enemy.update?.(deltaTime);
}