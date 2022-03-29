import mongoose from 'mongoose';

// Schema interface

interface Playlist {
	name: string,
	tags: string[],
	createdAt: Date,
	updatedAt: Date,
}

// Schema

const playlistSchema = new mongoose.Schema<Playlist>(
	{
		name: String,
		tags: [String],
		createdAt: {
			type: Date,
			default: () => Date.now(),
		},
		updatedAt: {
			type: Date,
			default: () => Date.now(),
		},
	}
);

// Middleware

playlistSchema.pre<Playlist>('save', function (next) {
	this.updatedAt = new Date(Date.now());
	next();
});

const Playlist = mongoose.model<Playlist>('Playlist', playlistSchema);

export { Playlist as Song };
