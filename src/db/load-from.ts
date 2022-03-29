import { Song } from './schemas/song.js';
import { parse } from '../parsers/csv.js';

export async function loadFrom(sourceLink: string) {
	const songs: Song[] = parse(sourceLink);
	await Song.deleteMany();
	await Song.insertMany(songs);
}
