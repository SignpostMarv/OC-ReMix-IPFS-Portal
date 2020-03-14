import * as ocremix from 'ocremix-ipfs-data/src/data/ocremix-cids.min.json';

export function cids(): {[path: string]: string} {
	return (ocremix as any).default;
}
