import mongoose from 'mongoose';

// Schema interface

interface Tag {
	name: string,
	color: string,
	createdAt: Date,
	updatedAt: Date,
}

// Schema

const tagSchema = new mongoose.Schema<Tag>(
	{
		name: String,
		color: String,
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

tagSchema.pre<Tag>('save', function (next) {
	this.updatedAt = new Date(Date.now());
	next();
});

const Tag = mongoose.model<Tag>('Tag', tagSchema);

export { Tag };
