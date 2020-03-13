export * from 'ocremix-ipfs-data/src/module';

export interface IpfsGlobal {
	create: () => Promise<IpfsInstance>;
}

export interface IpfsInstance {
	cat: (cid: string) => AsyncGenerator<Uint8Array>;
}

export type SupportedExtensionLower = (
	'mp3'|
	'png'|
	'jpg'|
	'jpeg'
);

export type SupportedExtensionUpperOrLower = (
	SupportedExtensionLower|
	'MP3'|
	'PNG'|
	'JPG'|
	'JPEG'
);

export interface MediaSessionNavigator extends Navigator {
	mediaSession: MediaSession;
}

export interface MediaSession {
	metadata: MediaMetadata;
	playbackState: 'none'|'paused'|'playing';
	setActionHandler: (type:string, callback: () => void) => void;
}

export interface MediaMetadataArtwork {
	src: string;
	sizes: string;
	type: string;
}

declare class MediaMetadata {
	title: string;
	artist: string;
	album: string;
	artwork: Array<MediaMetadataArtwork>;

	constructor({title, artist, album, artwork}: {
		title: string;
		artist: string;
		album: string;
		artwork: Array<MediaMetadataArtwork>;
	});
}
