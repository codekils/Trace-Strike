import { WORLD } from '../config/constants.js';

const CAMERA_LIMITS = Object.freeze({
	minPitch: -Math.PI * 0.34,
	maxPitch: Math.PI * 0.34
});

export class Camera {
	constructor(player) {
		this.player = player;

		this.fov = WORLD.FOV;
		this.height = WORLD.CAMERA_HEIGHT;

		// Vertical look angle.
		//
		// 0 = horizon centered.
		// Negative = look up.
		// Positive = look down.
		this.pitch = 0;

		// Small vertical position used by the renderer to move
		// the horizon without changing the player's world position.
		this.verticalOffset = 0;

		// Sensitivity applied to vertical mouse movement.
		// Horizontal sensitivity remains controlled by Player.
		this.pitchSensitivity = 0.0022;
	}

	get position() {
		return this.player.position;
	}

	get angle() {
		return this.player.angle;
	}

	get horizonOffset() {
		return this.verticalOffset;
	}

	/**
	 * Apply vertical mouse movement to the camera.
	 *
	 * The input value is kept separate from Player because
	 * vertical look is a camera operation, not a world-space
	 * movement operation.
	 */
	lookVertical(mouseDeltaY) {
		if (!Number.isFinite(mouseDeltaY)) {
			return;
		}

		this.pitch +=
			mouseDeltaY *
			this.pitchSensitivity;

		this.pitch = Math.max(
			CAMERA_LIMITS.minPitch,
			Math.min(
				CAMERA_LIMITS.maxPitch,
				this.pitch
			)
		);

		this.updateVerticalOffset();
	}

	/**
	 * Convert pitch into a screen-space horizon offset.
	 *
	 * The camera does not physically move in the world.
	 * Only the projected horizon moves.
	 */
	updateVerticalOffset() {
		const normalizedPitch =
			this.pitch /
			Math.max(
				Math.abs(CAMERA_LIMITS.minPitch),
				Math.abs(CAMERA_LIMITS.maxPitch)
			);

		this.verticalOffset =
			normalizedPitch *
			0.22;
	}

	resetLook() {
		this.pitch = 0;
		this.verticalOffset = 0;
	}
}