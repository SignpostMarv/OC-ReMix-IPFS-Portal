import album from 'ocremix-data/src/data/albums/OCRA-0006';
import * as cidMap from 'ocremix-ipfs-data/src/data/OCRA-0006.min.json';

export const data = {
	album,
	cids: (cidMap as any).default,
};
