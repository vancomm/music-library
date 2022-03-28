import mongoose from 'mongoose';

interface Song {
	track: string,
	artist: string,
	album: string,
	favorite: boolean,
	tags: string[],
	isrc: string,
	createdAt: Date,
	updatedAt: Date,
}

const userSchema = new mongoose.Schema<Song>({
	track: String,
	artist: String,
	album: String,
	favorite: Boolean,
	tags: [String],
	isrc: String,
	createdAt: {
		type: Date,
		default: () => Date.now(),
	},
	updatedAt: {
		type: Date,
		default: () => Date.now(),
	},
});

const Song = mongoose.model<Song>('Song', userSchema);

export { Song };