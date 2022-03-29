/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from 'chalk';
import mongoose from 'mongoose';
import { loadFrom } from './db/load-from.js';
import { Song } from './db/schemas/song.js';
import { Tag } from './db/schemas/tag.js';
import { uri } from './db/uri.js';
import { generateColor, getRandomInt } from './utils/index.js';

const sourceLink = '/home/vancomm/music-library/__fixtures__/source.csv';

async function run() {
	await mongoose.connect(uri);

	await loadFrom(sourceLink);

	// const result = Song.find({ tags: { $size: { $gt: 0 } } });

	// console.log(result.map((song) => song.toLine()).join('\n'));

	// console.log(songs.length);

	const result = await Song.find({ $where: 'this.tags.length > 1' }).populate<{ tags: Tag[] }>('tags');
	const message = result.map((song) => {
		const colored = song.tags.map(({ name, color }) => chalk.hex(color).bold(name)).join(' ');
		return `${song.toLine()} ${colored}`;
	}).join('\n');
	console.log(message);

	// const print = () => {
	// 	const color = generateColor();
	// 	console.log(chalk.hex(color).bold(color));
	// };

	// print();
	// print();
	// print();
	// print();
	// print();

	await mongoose.disconnect();
}

run();
