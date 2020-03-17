import album from 'ocremix-data/src/albums/OCRA-0008';
import * as cidMap from 'ocremix-ipfs-data/src/data/OCRA-0008.min.json';

export const data = {
	album,
	cids: (cidMap as any).default,
};
