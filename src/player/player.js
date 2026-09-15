import { PLAYER } from '../config/constants.js';
import { moveWithCollision } from '../world/collision.js';

export class Player {
  constructor(position) {
    this.position = {
      x: position.x,
      y: position.y
    };

    this.angle = Number.isFinite(position.angle)
      ? position.angle
      : 0;
    this.health = PLAYER.HEALTH;
    this.speed = PLAYER.SPEED;

    this.radius = PLAYER.RADIUS;

    // The camera is attached later by the game.
    this.camera = null;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  update(dt, input, world) {
    const deltaTime = Math.max(
      0,
      Number(dt) || 0
    );

    const mouse = input?.consumeMouse
      ? input.consumeMouse()
      : {
          deltaX: 0,
          deltaY: 0
        };

    this.updateLook(mouse);

    const movement = this.getMovementVector(input);

    if (
      Math.abs(movement.x) > 0 ||
      Math.abs(movement.y) > 0
    ) {
      moveWithCollision(
        this.position,
        movement.x * deltaTime,
        movement.y * deltaTime,
        world,
        this.radius
      );
    }
  }

  updateLook(mouse) {
    if (!mouse) {
      return;
    }

    const mouseDeltaX =
      Number.isFinite(mouse.deltaX)
        ? mouse.deltaX
        : 0;

    const mouseDeltaY =
      Number.isFinite(mouse.deltaY)
        ? mouse.deltaY
        : 0;

    this.angle +=
      mouseDeltaX *
      PLAYER.MOUSE_SENSITIVITY;

    if (this.camera) {
      this.camera.lookVertical(
        mouseDeltaY
      );
    }

    const fullTurn = Math.PI * 2;

    this.angle %= fullTurn;

    if (this.angle < 0) {
      this.angle += fullTurn;
    }
  }

  getMovementVector(input) {
    if (!input) {
      return {
        x: 0,
        y: 0
      };
    }

    let forward = 0;
    let strafe = 0;

    if (input.isDown('KeyW')) {
      forward += 1;
    }

    if (input.isDown('KeyS')) {
      forward -= 1;
    }

    if (input.isDown('KeyD')) {
      strafe += 1;
    }

    if (input.isDown('KeyA')) {
      strafe -= 1;
    }

    if (
      forward === 0 &&
      strafe === 0
    ) {
      return {
        x: 0,
        y: 0
      };
    }

    const length = Math.hypot(
      forward,
      strafe
    );

    forward /= length;
    strafe /= length;

    const forwardX =
      Math.cos(this.angle);

    const forwardY =
      Math.sin(this.angle);

    const rightX =
      Math.cos(this.angle + Math.PI / 2);

    const rightY =
      Math.sin(this.angle + Math.PI / 2);

    return {
      x:
        (
          forwardX * forward +
          rightX * strafe
        ) *
        this.speed,

      y:
        (
          forwardY * forward +
          rightY * strafe
        ) *
        this.speed
    };
  }

  takeDamage(amount) {
    const damage = Math.max(
      0,
      Number(amount) || 0
    );

    if (damage <= 0) {
      return false;
    }

    this.health = Math.max(
      0,
      this.health - damage
    );

    return true;
  }

  isAlive() {
    return this.health > 0;
  }
}