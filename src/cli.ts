import fs from 'fs';
import fsp from 'fs/promises';
import { program } from 'commander';
import mongoose from 'mongoose';
import { loadFrom } from './db/load-from.js';
import { Song } from './db/schemas/song.js';
import { uri } from './db/uri.js';
import { askForBool } from './inquire.js';

/* 	
	TODO:
	- import/export 
		- .JSON
		- .csv
		- plain text (?)
	- tags 
		- add
		- remove
		- filter
	- output playlists (based on tags)
*/

program
	.command('import')
	.description('import music library from a file')
	.argument('<filepath>', 'path to file')
	.action(async (filepath) => {
		await mongoose.connect(uri);
		await loadFrom(filepath);
		const count = await Song.countDocuments();
		const message = `Imported ${count} songs`;
		console.log(message);
		await mongoose.disconnect();
	});

program
	.command('show')
	.description('print your music library')
	.option('-f, --favorite', 'show favorite tracks only')
	.option('-t, --tags <tags...>', 'tags to filter output')
	.option('-o, --output <filepath>', 'redirect output to file')
	.action(async (options) => {
		const {
			favorite,
			tags,
			output } = options;

		await mongoose.connect(uri);

		const list = favorite
			? await Song.find().byTags(tags).favorites()
			: await Song.find().byTags(tags);

		await mongoose.disconnect();

		const lines = list.map((song) => song.toLine());
		const message = lines.join('\n');

		if (!output) {
			console.log(message);
			return;
		}

		const exists = fs.existsSync(output);
		if (exists) {
			const confirm = await askForBool('confirm', `${output} already exists! Are you sure you want to overwrite it?`);
			if (!confirm) return;
		}

		await fsp.writeFile(output, message);
		console.log('Success!');
	});

program.parse();
