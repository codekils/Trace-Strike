/**
 * Projection utilities for the Trace Strike 2.5D renderer.
 *
 * The world remains two-dimensional, but objects are projected
 * into screen space using camera-relative depth and perspective.
 */

export function focalLength(
	screenWidth,
	fov
) {
	const width = Math.max(
		1,
		Number(screenWidth) || 1
	);

	const safeFov = Math.max(
		0.01,
		Math.min(
			Math.PI - 0.01,
			Number(fov) || Math.PI / 3
		)
	);

	return width /
		(2 * Math.tan(safeFov * 0.5));
}

export function projectX(
	side,
	depth,
	screenWidth,
	fov
) {
	const safeDepth = Math.max(
		0.001,
		Number(depth) || 0
	);

	const focal =
		focalLength(
			screenWidth,
			fov
		);

	return (
		screenWidth * 0.5
	) + (
		side /
		safeDepth
	) * focal;
}

export function projectHeight(
	worldHeight,
	depth,
	screenWidth,
	fov,
	maxHeight
) {
	const safeHeight = Math.max(
		0,
		Number(worldHeight) || 0
	);

	const safeDepth = Math.max(
		0.001,
		Number(depth) || 0
	);

	const focal =
		focalLength(
			screenWidth,
			fov
		);

	const projected =
		safeHeight *
		focal /
		safeDepth;

	if (!Number.isFinite(maxHeight)) {
		return Math.max(
			0,
			projected
		);
	}

	return Math.max(
		0,
		Math.min(
			maxHeight,
			projected
		)
	);
}

export function worldToCamera(
	position,
	cameraPosition,
	cameraAngle
) {
	const dx =
		position.x -
		cameraPosition.x;

	const dy =
		position.y -
		cameraPosition.y;

	const cos =
		Math.cos(cameraAngle);

	const sin =
		Math.sin(cameraAngle);

	return {
		depth:
			dx * cos +
			dy * sin,

		side:
			-dx * sin +
			dy * cos
	};
}

export function projectPoint(
	point,
	camera,
	screenWidth,
	screenHeight,
	horizon
) {
	const relative =
		worldToCamera(
			point,
			camera.position,
			camera.angle
		);

	const safeDepth =
		Math.max(
			0.001,
			relative.depth
		);

	const x =
		projectX(
			relative.side,
			safeDepth,
			screenWidth,
			camera.fov
		);

	const worldZ =
		Number.isFinite(point.z)
			? point.z
			: 0;

	const focal =
		focalLength(
			screenWidth,
			camera.fov
		);

	const cameraHeight =
		Number.isFinite(camera.height)
			? camera.height
			: 0.5;

	const vertical =
		(
			worldZ -
			cameraHeight
		) *
		focal /
		safeDepth;

	const y =
		horizon -
		vertical;

	return {
		x,
		y,
		depth: safeDepth,
		side: relative.side
	};
}

export function projectVerticalSegment(
	position,
	worldHeight,
	camera,
	screenWidth,
	screenHeight,
	horizon
) {
	const base = projectPoint(
		{
			x: position.x,
			y: position.y,
			z: 0
		},
		camera,
		screenWidth,
		screenHeight,
		horizon
	);

	const height =
		projectHeight(
			worldHeight,
			base.depth,
			screenWidth,
			camera.fov,
			screenHeight * 1.5
		);

	return {
		x: base.x,
		top: base.y - height,
		bottom: base.y,
		height,
		depth: base.depth,
		side: base.side
	};
}

export function wallHeight(
	distance,
	height
) {
	const safeDistance =
		Math.max(
			0.001,
			Number(distance) || 0
		);

	const screenHeight =
		Math.max(
			1,
			Number(height) || 1
		);

	return Math.min(
		screenHeight * 1.8,
		screenHeight /
			safeDistance
	);
}

export function screenX(
	index,
	width,
	rays
) {
	const safeRays =
		Math.max(
			1,
			Number(rays) || 1
		);

	return (
		index *
		width /
		safeRays
	);
}