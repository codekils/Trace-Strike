export class Input {
  constructor(target = window) { this.keys = new Set(); this.mouse = { deltaX: 0, deltaY: 0, pressed: false }; target.addEventListener('keydown', e => { this.keys.add(e.code); }); target.addEventListener('keyup', e => this.keys.delete(e.code)); target.addEventListener('mousemove', e => { this.mouse.deltaX += e.movementX || 0; this.mouse.deltaY += e.movementY || 0; }); target.addEventListener('mousedown', e => { if (e.button === 0) this.mouse.pressed = true; }); target.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.pressed = false; }); }
  isDown(code) { return this.keys.has(code); }
  consumeMouse() { const delta = { ...this.mouse }; this.mouse.deltaX = 0; this.mouse.deltaY = 0; return delta; }
}