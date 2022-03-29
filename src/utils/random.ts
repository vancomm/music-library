export function getRandomInt(max: number): number;
export function getRandomInt(min: number, max?: number): number;
export function getRandomInt(first: number, second?: number): number {
	const [min, max] = second ? [first, second] : [0, first];
	return Math.round(min + (max - min) * Math.random());
}
