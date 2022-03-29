/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from 'chalk';
import mongoose from 'mongoose';
import { loadFrom } from './db/load-from.js';
import { Song } from './db/schemas/song.js';
import { uri } from './db/uri.js';
import { getRandomBrightColor } from './utils/random-color.js';

const sourceLink = '/home/vancomm/music-library/__fixtures__/source.csv';

async function run() {
	// await loadFrom(sourceLink);
	// await mongoose.connect(uri);
	// const result = await Song.find()
	// 	.favorites()
	// 	.byArtist(/radio/i)
	// 	.byTrack(/\b(you)\b/i);
	// await mongoose.disconnect();
	// const message = result.map((song) => song.toLine()).join('\n');
	// console.log(message);

	const print = () => {
		const color = getRandomBrightColor();
		console.log(chalk.hex(color).bold(color));
	};

	print();
	print();
	print();
	print();
	print();

}

run();
