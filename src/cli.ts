import { program } from 'commander';

/* 	
	TODO:
	- import/export (.JSON, .csv, plain text)
	- tags (add, remove, filter)
	- output playlists (based on tags)
*/

program
	.action(() => {
		console.log('Hello World!');
	});

program.parse();