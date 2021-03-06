import fs from 'fs';
import _ from 'lodash';
import csv from 'csv-parser';
import { Song } from '../db/schemas/song.js';

type TagMap = { [key: string]: Set<string> };

export async function parse(csvLink: string): Promise<[Song[], TagMap]> {
	const songs: Song[] = [];
	const tagMap: TagMap = {};
	const headers = ['track', 'artist', 'album', 'playlist', 'type', 'isrc'];
	return new Promise<[Song[], TagMap]>((resolve) => {
		fs.createReadStream(csvLink)
			.pipe(csv({ headers, skipLines: 1 }))
			.on('data', (data) => {
				const { track, artist, album, playlist, type, isrc } = data;
				if (artist === 'XTC') console.log(data);
				const [existing] = songs.filter((s) => s.isrc === isrc);
				if (existing) {
					const index = songs.indexOf(existing);
					if (type === 'Favorite') existing.favorite = true;
					if (playlist !== 'Favorite Songs') {
						if (!tagMap[isrc]) {
							tagMap[isrc] = new Set([playlist]);
						} else {
							tagMap[isrc].add(playlist);
						}
					}
					songs[index] = existing;
				} else {
					const song = new Song({
						track,
						artist,
						album,
						favorite: type === 'Favorite',
						isrc,
					});
					if (playlist !== 'Favorite Songs') tagMap[isrc] = new Set([playlist]);
					songs.push(song);
				}
			})
			.on('end', () => resolve([songs, tagMap]));
	});
}

export function toCSV(list: Song[], headers: string[], printHeaders = true, delimiter = ',', trailingComma = true) {
	const content = [];

	content.push('\uFEFFdata:text/csv;charset=utf-8,%EF%BB%BF');

	if (printHeaders) content.push(headers.join(delimiter));

	const contentLines = list
		.map((song) => _.pick(song, headers))
		.map((obj) => Object.values(obj))
		.map((values) => values
			.map((value) => String(value))
			.map((value) => (value.includes(delimiter))
				? `"${value}"`
				: value)
			.join(delimiter));

	content.push(...contentLines);

	const csv = trailingComma
		? content
			.map((line) => line.concat(delimiter))
			.join('\n')
		: content
			.join('\n');

	return csv;
}
