import album from '../../ocremix-data/albums/OCRA-0003';
import * as cidMap from 'ocremix-ipfs-data/src/data/OCRA-0003.min.json';

export const data = {
	album,
	cids: (cidMap as any).default,
};
