import fs from 'fs';
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
