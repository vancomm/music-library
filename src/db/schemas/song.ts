import mongoose from 'mongoose';

// Methods and virtuals interface

interface SongMethods {
	toLine(): string
}

interface SongBase {
	toLine(): string
}

// Schema interface

interface Song extends SongBase {
	track: string,
	artist: string,
	album: string,
	favorite: boolean,
	tags: string[],
	isrc: string,
	createdAt: Date,
	updatedAt: Date,
}

// Query helpers interface

interface SongQueryHelpers {
	byTags(...tags: string[]): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
	favorites(): mongoose.Query<Array<Song>, mongoose.Document<Song>> & SongQueryHelpers;
}

// Model interface

interface SongModel extends mongoose.Model<Song, SongQueryHelpers, SongMethods> {
	playlist(...tags: string[]): Promise<Array<Song>>;
	favorites(): Promise<Array<Song>>;
}

// Schema

const songSchema = new mongoose.Schema<Song, SongModel, SongMethods, SongQueryHelpers>(
	{
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
	},
	{
		toJSON: { virtuals: true }
	}
);

// Query helpers

songSchema.query.byTags = function (this: SongModel, ...tags: string[]): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	if (tags) return this.find({ tags: { $all: tags } });
	return this.find();
};

songSchema.query.favorites = function (this: SongModel): mongoose.Query<any, mongoose.Document<Song>> & SongQueryHelpers {
	return this.find({ favorite: true });
};

// Methods

songSchema.methods.toLine = function (this: Song): string {
	return `${this.artist} - ${this.track}`;
};

// Static methods

songSchema.statics.playlist = async function (this: SongModel, ...tags: string[]): Promise<Array<Song>> {
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
