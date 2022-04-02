import mongoose from 'mongoose';
import { Tag } from './tag.js';

export type PopulatedSong = Song | (Omit<Song, 'tags'> & {
	tags: Tag[];
});

// Methods and virtuals interface

interface SongMethods {
	toLine(): string
}

// Schema interface

interface Song extends SongMethods {
	track: string,
	artist: string,
	album: string,
	favorite: boolean,
	tags: mongoose.Types.ObjectId[],
	isrc: string,
	createdAt: Date,
	updatedAt: Date,
}

// Query helpers interface

interface SongQueryHelpers {
	byTrack(track: string | RegExp): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
	byArtist(artist: string | RegExp): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
	favorites(): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
	byTags(ids: mongoose.Types.ObjectId[]): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
}

// Static methods interface

interface SongModel extends mongoose.Model<Song, SongQueryHelpers, SongMethods> {
	playlist(tags: string[]): Promise<Array<Song>>;
	favorites(): Promise<Array<Song>>;
}

// Schema

const songSchema = new mongoose.Schema<Song, SongModel, SongMethods, SongQueryHelpers>(
	{
		track: String,
		artist: String,
		album: String,
		favorite: Boolean,
		tags: [{
			type: mongoose.Types.ObjectId,
			ref: 'Tag',
		}],
		isrc: String,
		createdAt: {
			type: Date,
			default: () => Date.now(),
		},
		updatedAt: {
			type: Date,
			default: () => Date.now(),
		},
	},
	{
		toJSON: { virtuals: true }
	}
);

// Query helpers

songSchema.query.byTrack = function (this: SongModel, track: string | RegExp): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	return this.find({ track: { $regex: track } });
};

songSchema.query.byArtist = function (this: SongModel, artist: string | RegExp): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	return this.find({ artist: { $regex: artist } });
};

songSchema.query.favorites = function (this: SongModel): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	return this.find({ favorite: true });
};

songSchema.query.byTags = function (this: SongModel, ids: mongoose.Types.ObjectId[]): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	if (ids) return this.find({ tags: { $all: ids } });
	return this.find();
};

// Methods

songSchema.methods.toLine = function (this: Song): string {
	return `${this.artist} - ${this.track}`;
};

// Static methods

songSchema.statics.playlist = async function (this: SongModel, tags: string[]): Promise<Array<Song>> {
	return (tags)
		? this.where({ tags: { $all: tags } })
		: this.where();
};

songSchema.statics.favorites = async function (this: SongModel): Promise<Array<Song>> {
	return this.where({ favorite: true });
};

// Middleware

songSchema.pre<Song>('save', function (next) {
	this.updatedAt = new Date(Date.now());
	next();
});

const Song = mongoose.model<Song, SongModel>('Song', songSchema);

export { Song };
