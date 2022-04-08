import fs from 'fs';
import fsp from 'fs/promises';
import mongoose from 'mongoose';
import { program } from 'commander';
import { uri } from './db/uri.js';
import { load } from './db/load.js';
import { PopulatedSong, Song } from './db/schemas/song.js';
import { Tag } from './db/schemas/tag.js';
import { askForBool } from './inquire.js';
import { toCSV } from './parsers/csv.js';
import chalk from 'chalk';

function printColored(message: string, color: string) {
	const colored = chalk.hex(color).bold(message);
	console.log(colored);
}

function success(message: string) {
	const green = '#C1E1C1';
	printColored(message, green);
}

function error(message: string) {
	// const pink = '#F0B6D5';
	const red = '#FF6961';
	printColored(message, red);
}

function makeFilename(tags: string[], favorite: boolean, extension: string) {
	const name = tags?.map((tag) => tag.replaceAll(' ', '-')).join('+') ?? '';
	const favoriteWord = tags?.length > 0 ? '(favorites)' : 'favorites';
	return favorite
		? name.concat(favoriteWord).concat(extension)
		: name.concat(extension);
}

function makeLine(song: PopulatedSong, markFavorites: boolean, favoriteSymbol: string, includeTags: boolean, color: boolean) {
	const line = [song.toLine()];

	if (markFavorites && song.favorite) {
		line.push(favoriteSymbol);
	}

	if (includeTags) {
		const tagStrings = (song.tags as Tag[])
			.map((tag) => color ? tag.toColoredLine() : tag.name);
		line.push(...tagStrings);
	}

	return line.join(' ');
}

async function saveToFile(filepath: string, content: string, forceRewrite = false) {
	const exists = fs.existsSync(filepath);
	if (exists && !forceRewrite) {
		const confirm = await askForBool('confirm', `${filepath} already exists! Are you sure you want to overwrite it?`);
		if (!confirm) return;
	}
	await fsp.writeFile(filepath, content, 'utf8');
	success(`Successfully saved to ${filepath}!`);
}

program
	.argument('<string>')
	.action((str) => {
		success('echo: ' + str);
	});

program
	.command('load')
	.description('load music library from a file')
	.argument('<filepath>', 'path to file')
	.action(async (filepath) => {
		await mongoose.connect(uri);
		await load(filepath);
		const count = await Song.countDocuments();
		const message = `Loaded ${count} songs`;
		success(message);
		await mongoose.disconnect();
	});

program
	.command('export')
	.description('export loaded music library to a .csv file')
	.option('-f, --favorite', 'include favorites only')
	.option('-t, --tags <tags...>', 'filter by tags')
	.option('-T, --use-tags', 'use tags as filename (this option overrides --path!)')
	.option('-p, --path <filepath>', 'set path to file', 'export.csv')
	.option('-y, --force-rewrite', 'skip confirmation before rewriting existing file')
	.option('-d, --delimiter <symbol>', 'set delimiter symbol', ',')
	.option('-N, --no-print-headers', 'remove headers from output file')
	.option('-H, --headers <headers...>', 'list of headers (default values: "track", "artist", "album", "isrc")')
	.action(async (options) => {
		try {
			// console.log(options);
			// return;

			const defaultHeaders = ['track', 'artist', 'album', 'isrc'];
			const headers = options.headers ?? defaultHeaders;

			const filepath = options.useTags ? makeFilename(options.tags, options.favorite, '.csv') : options.path;

			const { favorite, tags, delimiter, printHeaders, forceRewrite } = options;

			await mongoose.connect(uri);

			const ids = await Tag.find({ name: { $in: tags } }).distinct('_id');

			const list = tags
				? favorite
					? await Song.find().byTags(ids).favorites()
					: await Song.find().byTags(ids)
				: favorite
					? await Song.find().favorites()
					: await Song.find();

			if (list.length === 0) {
				error('Nothing to export!');
				return;
			}

			const output = toCSV(list, headers, printHeaders, delimiter);

			await saveToFile(filepath, output, forceRewrite);
		}
		catch (err) {
			// console.error((err as Error).message);
			error(err as string);
		}
		finally {
			await mongoose.disconnect();
		}
	});



program
	.command('find')
	.description('find songs in your music library')
	.option('-f, --favorite', 'favorite tracks only')
	.option('-n, --name <name>', 'search by track name')
	.option('-a, --artist <artist>', 'search by artist')
	.option('-A, --album <album>', 'search by album')
	.option('-t, --tags <tags...>', 'search by tags')
	.option('-i, --include-tags', 'include colored tags')
	.option('-T, --find-tags', 'find all tags in the library')
	.option('-m, --mark-favorites', 'append favorite tracks with a symbol')
	.option('-S, --favorite-symbol [symbol]', 'symbol to mark favorites', '❤️')
	.option('-N, --no-color', 'do not color tags')
	.action(async (opts) => {
		try {
			await mongoose.connect(uri);

			if (opts.findTags) {
				const savedTags = await Tag.find();
				const message = savedTags.map((tag) => opts.color ? tag.toColoredLine() : tag.name).join('\n');
				console.log(message);
				await mongoose.disconnect();
				return;
			}

			const found = await Tag.find({ name: { $in: opts.tags } }).distinct('_id');

			if (opts.tags && found.length === 0) {
				error('Your query yielded no result!');
				return;
			}

			const ids = found;

			const list = opts.includeTags
				? opts.favorite
					? await Song.find().byName(opts.name).byArtist(opts.artist).byAlbum(opts.album).byTags(ids).favorites().populate<{ tags: Tag[] }>('tags')
					: await Song.find().byName(opts.name).byArtist(opts.artist).byAlbum(opts.album).byTags(ids).populate<{ tags: Tag[] }>('tags')
				: opts.favorite
					? await Song.find().byName(opts.name).byArtist(opts.artist).byAlbum(opts.album).byTags(ids).favorites()
					: await Song.find().byName(opts.name).byArtist(opts.artist).byAlbum(opts.album).byTags(ids);

			const message = list
				.map((song) => makeLine(song, opts.markFavorites, opts.favoriteSymbol, opts.includeTags, opts.color))
				.join('\n');

			console.log(message);
		}
		catch (err) {
			// console.error((err as Error).message);
			error(err as string);
		}
		finally {
			await mongoose.disconnect();
		}
	});

program.parse();
