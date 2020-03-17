import {
	Track,
	ImageSource,
	SrcsetSource,
	MediaSessionNavigator,
	CIDMap,
	MediaMetadataArtwork,
	SupportedExtensionUpperOrLower,
	SupportedExtensionLower,
	Album,
	Credit,
} from '../../module';
import { urlForThing, albumTrackCID } from '../data';
import { mimeType } from '../mimeType';
import {
	ImageSourceElement,
	ImageSourceList,
} from '../elements/image-source';

const preloadArtPromises: WeakMap<Track, Promise<string[]>> = new WeakMap();
const completed = new WeakSet();

async function preloadTrackArt(
	track: Track,
	art: ImageSource[],
	cids: CIDMap
): Promise<[Track, string[], 'started'|'pending'|'complete']> {
	if ( ! preloadArtPromises.has(track)) {
		const reduced = art.reduce(
			(
				sources: SrcsetSource[],
				source: ImageSource,
			): SrcsetSource[] => {
				sources.push(source);

				sources.push(...source.srcset);

				return sources;
			},
			[]
		);

		const promise: Promise<string[]> = new Promise((yup) => {
			Promise.all(reduced.map((source: SrcsetSource) => {
				return urlForThing(source, source.subpath, cids)
			})).then((done) => {
				completed.add(promise);

				yup(done);
			})
		});

		preloadArtPromises.set(track, promise);

		return [track, [], 'started'];
	} else {
		const promise = preloadArtPromises.get(track) as Promise<string[]>;

		if ( ! completed.has(promise)) {
			return [track, [], 'pending'];
		}

		return [track, await promise, 'complete'];
	}
}

async function ArtToMediaMetadataArt(
	sources: ImageSource[],
	cids: CIDMap
): Promise<MediaMetadataArtwork[]> {
	return await Promise.all(sources.map(async (art) => {

		const path = art.subpath;
		const match = /.(png|jpe?g)$/i.exec(path);

		if ( ! match) {
			throw new Error('Unsupported file type requested!');
		}

		const [, EXT] = match;

		const ext = (
			(
				EXT as SupportedExtensionUpperOrLower
			).toLowerCase() as SupportedExtensionLower
		);

		return {
			src: await urlForThing(art, path, cids),
			sizes: `${art.width}x${art.height}`,
			type: mimeType(ext),
		} as MediaMetadataArtwork;
	}));
}

function resetMediaSessionActionHandlers(): void {
	if ('mediaSession' in navigator) {
		const mediaSession = (navigator as MediaSessionNavigator).mediaSession;

		[
			'play',
			'pause',
			'seekbackward',
			'seekforward',
			'previoustrack',
			'nexttrack',
		].forEach((type) => {
			mediaSession.setActionHandler(type, null);
		});
	}
}

function oxfordComma(...items: Array<string>): string {
	const formatted = (new (Intl as any).ListFormat(
		'en',
		{
			style: 'long',
			type: 'conjunction',
		})
	).format(items);

	if (items.length > 2) {
		return formatted.replace(/([^ ]), and /, '$1, and ');
	}

	return formatted;
}

async function queueUpMediaSessionActionHandlers(
	target: PlayTarget,
	tracks: PlayTargetTrack[],
	album: Album,
	track: Track,
	art: ImageSource[],
	cids: CIDMap
): Promise<void> {
	resetMediaSessionActionHandlers();

	if ('mediaSession' in navigator) {
		const mediaSession = (navigator as MediaSessionNavigator).mediaSession;

		const artwork = (
			(art.length < 1)
				? []
				: await ArtToMediaMetadataArt(art, cids)
		);

		const metadata = new (window as any).MediaMetadata({
			artist: oxfordComma(...track.credits.map(
				(credit: string|Credit): string => {
					return ('string' === typeof credit)
							? credit
							: (
								('string' === typeof credit.name)
									? credit.name
									: Object.values(credit.name)[0]
							);
				}
			)),
			title: track.name,
			album: album.name,
			artwork,
		});

		mediaSession.metadata = metadata;

		mediaSession.setActionHandler('play', async () => {
			if (
				target.currentTrack &&
				target.currentTrack[1] === track &&
				! target.isPlaying
			) {
				await target.target.play();
			}
		});

		mediaSession.setActionHandler('pause', async () => {
			if (
				target.currentTrack &&
				target.currentTrack[1] === track &&
				target.isPlaying
			) {
				target.target.pause();
			}
		});

		if (tracks.length > 1) {

			let position = -1;

			for(let i = 0; i < tracks.length; ++i) {
				const otherTrack = tracks[i];

				if (
					album === otherTrack[0] &&
					track === otherTrack[1] &&
					art === otherTrack[2] &&
					cids === otherTrack[3]
				) {
					position = i;

					break;
				}
			}

			if (position >= 0) {
				mediaSession.setActionHandler('previoustrack', async () => {
					const trackPosition = (
						position <= 0
							? Math.max(0, tracks.length - 1)
							: position - 1
					);

					target.play(tracks[trackPosition]);
				});
				mediaSession.setActionHandler('nexttrack', async () => {
					const trackPosition = (
						position >= (tracks.length -1)
							? 0
							: Math.min(tracks.length - 1, position + 1)
					);

					target.play(tracks[trackPosition]);
				});
			}
		}
	}
}

export type PlayTargetTrack = [
	Album,
	Track,
	ImageSource[],
	CIDMap,
	ImageSource|undefined,
	ImageSource[],
];

export class PlayTarget
{
	target: HTMLAudioElement;
	background: ImageSourceElement;
	covers: ImageSourceList;
	currentTrack: PlayTargetTrack|undefined;
	otherTracks: PlayTargetTrack[] = [];
	isPlaying: boolean;
	cidMostRecentlyAttemptedToPlay = '';

	constructor(
		target: HTMLAudioElement,
		background: ImageSourceElement,
		covers: ImageSourceList,
		isPlaying: boolean
	) {
		target.addEventListener('ended', () => {
			this.currentTrack = undefined;
		});

		target.addEventListener('playing', async () => {
			this.isPlaying = true;

			if (this.currentTrack) {
				const maybe = await preloadTrackArt(
					this.currentTrack[1],
					this.currentTrack[2],
					this.currentTrack[3]
				);

				if (maybe.length > 0 && maybe[0] === this.currentTrack[1]) {
					await queueUpMediaSessionActionHandlers(
						this,
						this.otherTracks,
						this.currentTrack[0],
						this.currentTrack[1],
						this.currentTrack[2],
						this.currentTrack[3]
					);
				}
			}
		});

		target.addEventListener('pause', () => {
			this.isPlaying = false;
		});

		this.target = target;
		this.background = background;
		this.covers = covers;
		this.isPlaying = isPlaying;
	}

	async play(
		freshTrack: PlayTargetTrack,
		onpause: undefined|(() => void) = undefined,
		onpending: undefined|(() => void) = undefined,
		ondone: undefined|(() => void) = undefined
	): Promise<void> {
		if (
			this.currentTrack &&
			this.currentTrack[1] === freshTrack[1]
		) {
			if (this.isPlaying) {
				this.target.pause();
			}

			if (onpause) {
				onpause();
			}

			this.currentTrack = undefined;

			return;
		}

		this.background.hidden = true;
		this.covers.hidden = true;

		if (onpending) {
			onpending();
		}

		const cid = await albumTrackCID(freshTrack[1], freshTrack[3]);

		this.cidMostRecentlyAttemptedToPlay = cid;

		const trackUrl = await urlForThing(
			freshTrack[1],
			freshTrack[1].subpath,
			freshTrack[3]
		);

		if (cid === this.cidMostRecentlyAttemptedToPlay) {
			this.currentTrack = freshTrack;

			if (this.target.src !== trackUrl) {
				if (this.isPlaying) {
					this.target.pause();
				}

				this.target.src = trackUrl;
			}

			await this.target.play();

			if (freshTrack[4]) {
				console.log('setting background');

				this.background.cidMap = freshTrack[3];
				this.background.source = freshTrack[4];
				this.background.hidden = false;
			}

			console.log('setting covers');

			this.covers.sources = [freshTrack[3], freshTrack[5]];
			this.covers.hidden = false;
		}

		if (ondone) {
			ondone();
		}
	}
}
