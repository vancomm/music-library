import fs from 'fs';
import fsp from 'fs/promises';
import mongoose from 'mongoose';
import { program } from 'commander';
import { uri } from './db/uri.js';
import { loadFrom } from './db/load-from.js';
import { PopulatedSong, Song } from './db/schemas/song.js';
import { Tag } from './db/schemas/tag.js';
import { askForBool } from './inquire.js';
import { toCSV } from './parsers/csv.js';

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

async function saveToFile(filepath: string, content: string) {
	const exists = fs.existsSync(filepath);
	if (exists) {
		const confirm = await askForBool('confirm', `${filepath} already exists! Are you sure you want to overwrite it?`);
		if (!confirm) return;
	}

	await fsp.writeFile(filepath, content, 'utf8');
	console.log(`Successfully saved to ${filepath}!`);
}

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

function makeFilename(tags: string[], favorite: boolean, extension: string) {
	const name = tags.map((tag) => tag.replaceAll(' ', '-')).join('+');
	return favorite
		? name.concat('(favorites)').concat(extension)
		: name.concat(extension);
}

program
	.command('export')
	.description('export loaded music library to a .csv file')
	.option('-f, --favorite', 'favorites only')
	.option('-t, --tags <tags...>', 'filter by tags')
	.option('-T, --use-tags', 'use tags as filename', false)
	.option('-p, --path <filepath>', 'path to file', 'export.csv')
	.option('-d, --delimiter <symbol>', 'delimiter symbol', ',')
	.option('-N, --no-print-headers', 'disable printed headers')
	.option('-H, --headers <headers...>', 'list of headers (default values: "track", "artist", "album", "isrc")')
	.action(async (options) => {
		// console.log(options);
		// return;

		const defaultHeaders = ['track', 'artist', 'album', 'isrc'];
		const headers = options.headers ?? defaultHeaders;

		const filepath = options.useTags ? makeFilename(options.tags, options.favorite, '.csv') : options.path;

		const { favorite, tags, delimiter, printHeaders } = options;

		await mongoose.connect(uri);

		const ids = await Tag.find({ name: { $in: tags } }).distinct('_id');

		const list = tags
			? favorite
				? await Song.find().byTags(ids).favorites()
				: await Song.find().byTags(ids)
			: favorite
				? await Song.find().favorites()
				: await Song.find();

		await mongoose.disconnect();

		if (list.length === 0) {
			console.log('Nothing to export!');
			return;
		}

		const output = toCSV(list, headers, printHeaders, delimiter);

		await saveToFile(filepath, output);
	});

function makeLine(song: PopulatedSong, markFavorites: boolean, favoriteSymbol: string, includeTags: boolean) {
	const line = [song.toLine()];

	if (markFavorites && song.favorite) {
		line.push(favoriteSymbol);
	}

	if (includeTags) {
		const tagStrings = song.tags
			.map((tag) => (tag as Tag).toColoredLine());
		line.push(...tagStrings);
	}

	return line.join(' ');
}

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

		const message = list
			.map((song) => makeLine(song, markFavorites, favoriteSymbol, includeTags))
			.join('\n');

		if (!output) {
			console.log(message);
			return;
		}

		await saveToFile(output, message);
	});

program.parse();
