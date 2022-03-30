import fs from 'fs';
import fsp from 'fs/promises';
import mongoose from 'mongoose';
import { program } from 'commander';
import { uri } from './db/uri.js';
import { loadFrom } from './db/load-from.js';
import { Song } from './db/schemas/song.js';
import { Tag } from './db/schemas/tag.js';
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
	.option('-F, --mark-favorites', 'append favorite tracks with a symbol')
	.option('-S, --favorite-symbol [symbol]', 'symbol to mark favorites', '❤️')
	.option('-T, --include-tags', 'include colored tags')
	.action(async (options) => {
		const {
			favorite,
			tags,
			output,
			markFavorites,
			favoriteSymbol,
			includeTags
		} = options;

		await mongoose.connect(uri);

		const ids = await Tag.find({ name: { $in: tags } }).distinct('_id');

		const list = includeTags
			? tags
				? favorite
					? await Song.find().byTags(ids).favorites().populate<{ tags: Tag[] }>('tags')
					: await Song.find().byTags(ids).populate<{ tags: Tag[] }>('tags')
				: favorite
					? await Song.find().favorites().populate<{ tags: Tag[] }>('tags')
					: await Song.find().populate<{ tags: Tag[] }>('tags')
			: tags
				? favorite
					? await Song.find().byTags(ids).favorites()
					: await Song.find().byTags(ids)
				: favorite
					? await Song.find().favorites()
					: await Song.find();

		await mongoose.disconnect();

		const message = list.map((song) => {
			const lines = [song.toLine()];
			if (markFavorites && song.favorite) {
				lines.push(favoriteSymbol);
			}
			if (includeTags) {
				const tagStrings = song.tags
					.map((tag) => (tag as Tag).toColoredLine());
				lines.push(...tagStrings);
			}
			return lines.join(' ');
		}).join('\n');

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
