import {
	Album,
} from '../../module';

export type AlbumResult = {
	album: Album;
	cids: {[subpath: string]: string};
}

export const Albums: {
	[id: string]: () => Promise<AlbumResult>;
} = {
	OCRA0003: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0003.js');

		return data;
	},
	OCRA0006: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0006.js');

		return data;
	},
	OCRA0008: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0008.js');

		return data;
	},
	OCRA0025: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0025.js');

		return data;
	},
	OCRA0029: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0029.js');

		return data;
	},
	OCRA0060: async (): Promise<AlbumResult> => {
		const { data } = await import('./OCRA-0060.js');

		return data;
	},
};

export async function* AlbumsIterator(): AsyncGenerator<Album> {
	for (const id of Object.keys(Albums)) {
		yield await (await Albums[id]()).album;
	}
}
