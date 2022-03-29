import { range } from './range.js';

const getColorSum = (color: string) => {
	const red = parseInt(color.slice(0, 2), 16);
	const green = parseInt(color.slice(0, 2), 16);
	const blue = parseInt(color.slice(0, 2), 16);
	return red + green + blue;
};

export function getRandomBrightColor(): string {
	const THRESHOLD = 382;
	const letters = '0123456789ABCDEF';
	const color = range(6).map(() => letters[Math.floor(Math.random() * letters.length)]).join('');
	if (getColorSum(color) < THRESHOLD) return getRandomBrightColor();
	return `#${color}`;
}
