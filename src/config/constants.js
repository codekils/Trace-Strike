export const GAME_STATES = Object.freeze({ MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' });
export const WORLD = Object.freeze({ TILE: 1, PLAYER_RADIUS: .18, MAX_RAYS: 360, FOV: Math.PI / 3, CAMERA_HEIGHT: .5, MAX_DT: .05 });
export const PLAYER = Object.freeze({ SPEED: 2.5, HEALTH: 100, MOUSE_SENSITIVITY: .0025 });
export const COLORS = Object.freeze({ SKY: '#050606', FLOOR: '#070908', WALL: '#e9f0e8', WALL_DARK: '#58615c', ENEMY: '#ff403d', HIT: '#fff4db' });