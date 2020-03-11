export {
	SrcsetSource,
	ImageSource,
	Discs,
	Album,
	AlbumWithArt,
	Track,
} from './data/module';

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
