import { load } from './db/load.js';

const sourceLink = '/home/vancomm/music-library/__fixtures__/source.csv';

async function run() {
	await load(sourceLink);
}

run();
