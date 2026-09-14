import { COLORS } from '../config/constants.js';

export class Raycaster {
	constructor(world) {
		this.world = world;
	}

	cast(camera, rayCount, maxDistance = 30) {
		const hits = new Array(rayCount);

		for (let column = 0; column < rayCount; column++) {
			const cameraX = column / rayCount - .5;
			const angle = camera.angle + camera.fov * cameraX;
			const rawDistance = this.distanceToWall(
				camera.position,
				angle,
				maxDistance
			);
			const hitX = camera.position.x + Math.cos(angle) * rawDistance;
			const hitY = camera.position.y + Math.sin(angle) * rawDistance;

			hits[column] = {
				distance: rawDistance * Math.cos(cameraX * camera.fov),
				shade: Math.max(.2, 1 - rawDistance / maxDistance),
				color: COLORS.WALL,
				cellX: Math.floor(hitX),
				cellY: Math.floor(hitY)
			};
		}

		return hits;
	}

	distanceToWall(origin, angle, maxDistance = 30) {
		let distance = 0;

		while (distance < maxDistance) {
			distance += .035;

			if (
				this.world.isWall(
					origin.x + Math.cos(angle) * distance,
					origin.y + Math.sin(angle) * distance
				)
			) {
				break;
			}
		}

		return distance;
	}

	hasLineOfSight(origin, target) {
		const distance = Math.hypot(
			target.x - origin.x,
			target.y - origin.y
		);
		const angle = Math.atan2(
			target.y - origin.y,
			target.x - origin.x
		);

		return this.distanceToWall(
			origin,
			angle,
			distance + .1
		) >= distance - .1;
	}
}