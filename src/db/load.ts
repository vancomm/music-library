import mongoose from 'mongoose';
import { Song } from './song.js';
import csv from 'csv-parser';
import fs from 'fs';

const uri = 'mongodb://localhost/test';
mongoose.connect(uri);

export async function load(sourceLink: string) {
	const songs: Song[] = [];
	const headers = ['track', 'artist', 'album', 'playlist', 'type', 'isrc'];
	fs.createReadStream(sourceLink)
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
		})
		.on('end', async () => {
			console.log(songs.length);
			await Song.insertMany(songs);
			return mongoose.disconnect();
		});
}
