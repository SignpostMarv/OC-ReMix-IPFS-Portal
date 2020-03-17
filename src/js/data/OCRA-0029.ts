import album from 'ocremix-data/src/albums/OCRA-0029';
import * as cidMap from 'ocremix-ipfs-data/src/data/OCRA-0029.min.json';

export const data = {
	album,
	cids: (cidMap as any).default,
};
