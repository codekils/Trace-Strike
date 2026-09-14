import {
	MAP,
	SPAWN_POINTS,
	MAP_OBJECTS
} from './map.js';

export class World {
	constructor() {
		this.map = MAP;

		this.width = MAP[0].length;
		this.height = MAP.length;

		this.enemies = [];

		this.spawnPoints = SPAWN_POINTS;

		this.walls = [];

		for (
			let y = 0;
			y < this.height;
			y++
		) {
			for (
				let x = 0;
				x < this.width;
				x++
			) {
				if (
					MAP[y][x] === '#'
				) {
					this.walls.push({
						x,
						y
					});
				}
			}
		}

		this.objects = {
			crates: this.normalizeObjects(
				MAP_OBJECTS?.crates
			),

			barrels: this.normalizeObjects(
				MAP_OBJECTS?.barrels
			),

			doors: this.normalizeObjects(
				MAP_OBJECTS?.doors
			)
		};

		this.crates = this.objects.crates;
		this.barrels = this.objects.barrels;
		this.doors = this.objects.doors;
	}

	normalizeObjects(objects) {
		if (!Array.isArray(objects)) {
			return [];
		}

		return objects
			.filter(
				object =>
					object &&
					Number.isFinite(object.x) &&
					Number.isFinite(object.y)
			)
			.map(
				object => ({
					...object,
					x: Number(object.x),
					y: Number(object.y)
				})
			);
	}

	isWall(x, y) {
		const cell =
			this.map[
				Math.floor(y)
			]?.[
				Math.floor(x)
			];

		return cell === '#';
	}

	getSpawnPositions(
		count,
		playerPosition
	) {
		const valid =
			this.spawnPoints.filter(
				point =>
					!this.isWall(
						point.x,
						point.y
					) &&
					Math.hypot(
						point.x -
							playerPosition.x,
						point.y -
							playerPosition.y
					) > 2.5
			);

		const positions = [];

		for (
			let index = 0;
			index < count;
			index++
		) {
			if (valid.length === 0) {
				break;
			}

			positions.push({
				...valid[
					index %
					valid.length
				]
			});
		}

		return positions;
	}

	getObjects() {
		return {
			crates: this.crates,
			barrels: this.barrels,
			doors: this.doors
		};
	}
}