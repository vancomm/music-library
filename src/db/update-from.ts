import { Song } from './schemas/song.js';
import { parse } from '../parsers/csv.js';

export async function updateFrom(sourceLink: string) {
	const songs: Song[] = parse(sourceLink);
	await Song.deleteMany();
	await Song.insertMany(songs);
}
