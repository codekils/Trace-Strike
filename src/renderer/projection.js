export const wallHeight = (distance, height) => Math.min(height * 1.8, height / Math.max(distance, .001));
export const screenX = (index, width, rays) => index * width / rays;