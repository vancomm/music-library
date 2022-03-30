import chalk from 'chalk';
import mongoose from 'mongoose';

// Methods and virtuals interface

interface TagMethods {
	toColoredLine(): string
}

// Schema interface

interface Tag extends TagMethods {
	name: string,
	color: string,
	createdAt: Date,
	updatedAt: Date,
}

// Schema

const tagSchema = new mongoose.Schema<Tag, mongoose.Model<Tag>, TagMethods>(
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
	},
	{
		toJSON: { virtuals: true }
	}
);

// Methods

tagSchema.methods.toColoredLine = function (this: Tag) {
	return chalk.hex(this.color).bold(this.name);
};

// Middleware

tagSchema.pre<Tag>('save', function (next) {
	this.updatedAt = new Date(Date.now());
	next();
});

const Tag = mongoose.model<Tag>('Tag', tagSchema);

export { Tag };
