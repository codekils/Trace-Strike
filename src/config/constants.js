export const GAME_STATES = Object.freeze({ MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' });
export const WORLD = Object.freeze({ TILE: 1, PLAYER_RADIUS: .18, MAX_RAYS: 360, FOV: Math.PI / 3, CAMERA_HEIGHT: .5, MAX_DT: .05 });
export const PLAYER = Object.freeze({ SPEED: 2.5, HEALTH: 100, MOUSE_SENSITIVITY: .0025 });
export const COLORS = Object.freeze({ SKY: '#0a0e0d', FLOOR: '#111715', WALL: '#b9d5bf', WALL_DARK: '#567064', ENEMY: '#ff4d5f', HIT: '#fff4db' });