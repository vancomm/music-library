import { Song } from './schemas/song.js';
import { parse } from '../parsers/csv.js';
import { Tag } from './schemas/tag.js';
import { generateColor } from '../utils/random-color.js';

export async function loadFrom(sourceLink: string) {
	const [songs, tagMap] = await parse(sourceLink);

	const uniqueTags = [...new Set(Object.values(tagMap).map((set) => [...set]).flat())];

	const tags = uniqueTags.map((name) => new Tag({
		name,
		color: generateColor(),
	}));

	await Tag.deleteMany();
	const result = await Tag.insertMany(tags);

	const songsWithTags = songs.map((song) => {
		if (!tagMap[song.isrc]) return song;
		const songTagIDs = [...tagMap[song.isrc]]
			.map((name) => {
				const found = result.find((tag) => tag.name === name);
				/* 
					FIXME:

					¯\_(ツ)_/¯
				*/
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				return found!._id;
			});
		song.tags = songTagIDs;
		return song;
	});

	await Song.deleteMany();
	await Song.insertMany(songsWithTags);
}
