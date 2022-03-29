import fs from 'fs';
import csv from 'csv-parser';
import { Song } from '../db/schemas/song.js';

export function parse(csvLink: string): Song[] {
	const songs: Song[] = [];
	const headers = ['track', 'artist', 'album', 'playlist', 'type', 'isrc'];
	fs.createReadStream(csvLink)
		.pipe(csv({ headers, skipLines: 1 }))
		.on('data', (data) => {
			const { track, artist, album, playlist, type, isrc } = data;
			const [existing] = songs.filter((s) => s.isrc === isrc);
			if (existing) {
				const index = songs.indexOf(existing);
				existing.favorite = existing.favorite || type === 'Favorite';
				if (playlist !== 'Favorite Songs') existing.tags = [...new Set([...existing.tags]).add(playlist).values()];
				songs[index] = existing;
			} else {
				const song = new Song({
					track,
					artist,
					album,
					favorite: type === 'Favorite',
					tags: playlist === 'Favorite Songs' ? [] : [playlist],
					isrc,
				});
				songs.push(song);
			}
		});
	return songs;
}
