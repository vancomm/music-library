import { range } from './range.js';
import { getRandomInt } from './random.js';

export function generateColor(): string {
	const color = range(3)
		.map(() => getRandomInt(255))
		.map((num) => Math.round((num + 255) / 2))
		.map((num) => num.toString(16))
		.join('');

	return `#${color}`;
}
