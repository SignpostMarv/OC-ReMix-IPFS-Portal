import {
	Album,
	AlbumWithArt,
	/*
	Track,
	BrokenTrack,
	MediaSessionNavigator,
	MediaMetadataArtwork,
	SupportedExtensionUpperOrLower,
	SupportedExtensionLower,
	Credit,
	Disc,
	SrcsetSource,
	ImageSource,
	*/
	CIDMap,
	Track,
	ImageSource,
} from '../../module';
/*
import {
	albumTrackCID,
	urlForThing,
} from '../data.js';
*/
import {
	Albums,
} from '../data/albums.js';
import {
	html,
	render,
} from 'lit-html';
/*
import {
	mimeType,
} from '../mimeType.js';
*/
import {
	PlayTarget
} from '../utilities/play-target';

/*
let currentTrack: Track|undefined;
let isPlaying = false;
*/

const views: WeakMap<Album, HTMLElement> = new WeakMap();
const audio = ((): HTMLAudioElement => {
	const audio = document.createElement('audio');

	audio.controls = true;
	audio.src=  '';

	/*
	audio.addEventListener('ended', () => {
		currentTrack = undefined;
	});
	audio.onplaying = (): void => {
		isPlaying = true;
	};
	audio.onpause = (): void => {
		isPlaying = false;
	}
	*/

	return audio;
})();

const playTarget = new PlayTarget(audio, false);

/*
const preloadAlbumDiscArtPromises: WeakMap<
	Album,
	Promise<string[]>
> = new WeakMap();
const completed: WeakSet<Promise<string[]>> = new WeakSet();

async function preloadAlbumDiscArt(
	album: Album,
	cids: CIDMap
): Promise<string[]> {
	if ( ! preloadAlbumDiscArtPromises.has(album)) {
		const promise: Promise<string[]> = new Promise((yup) => {
			Promise.all(album.discs.reduce(
				(
					sources: Array<SrcsetSource>,
					disc: Disc
				): Array<SrcsetSource> => {
					disc.art.forEach((source: ImageSource): void => {
						sources.push(source);

						source.srcset.forEach((srcset) => {
							sources.push(srcset);
						});
					});

					return sources;
				},
				[]
			).map((source: SrcsetSource): Promise<string> => {
				return urlForThing(source, source.subpath, cids);
			})).then((done) => {

				completed.add(promise);

				yup(done);
			});
		});

		preloadAlbumDiscArtPromises.set(album, promise);

		return [];
	} else {
		const promise = preloadAlbumDiscArtPromises.get(
			album
		) as Promise<string[]>;

		if ( ! completed.has(promise)) {
			return [];
		}

		return await promise;
	}
}

let trackMostRecentlyAttemptedToPlay: string|undefined;
*/

document.body.appendChild(audio);

/*
async function play(src: string): Promise<void> {
	if (audio.src !== src) {
		if (isPlaying) {
			audio.pause();
		}

		audio.src = src;
	}

	return audio.play();
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

async function DiscToMediaMetadataArt(
	disc: Disc,
	cids: CIDMap
): Promise<Array<MediaMetadataArtwork>> {
	const out: Array<MediaMetadataArtwork> = [];

	return await Promise.all(disc.art.map(
		async (art): Promise<MediaMetadataArtwork> => {
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
			};
		}
	));

	return out;
}

async function MaybeDiscToMediaMetadataArt(
	album: Album,
	disc: Disc,
	cids: CIDMap
): Promise<Array<MediaMetadataArtwork>> {
	const maybe = await preloadAlbumDiscArt(album, cids);

	if (maybe.length > 0) {
		return await DiscToMediaMetadataArt(disc, cids);
	}

	return [];
}

async function queueUpMediaSessionActionHandlers(
	album: Album,
	disc: Disc,
	track: Track,
	cids: CIDMap,
	playOtherTrack: ((
		album: Album,
		disc: Disc,
		track: Track,
		cids: CIDMap,
		beforeAttempt: undefined|(() => void),
		beforeFetchUrl: undefined|(() => Promise<void>)
	) => Promise<void>)
): Promise<void> {
	resetMediaSessionActionHandlers();

	if ('mediaSession' in navigator) {
		const mediaSession = (navigator as MediaSessionNavigator).mediaSession;

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
			artwork: (
				(disc.art.length < 1)
					? []
					: await MaybeDiscToMediaMetadataArt(
						album,
						disc,
						cids
					)
			),
		});

		mediaSession.metadata = metadata;

		mediaSession.setActionHandler('play', async () => {
			if (currentTrack === track && ! isPlaying) {
				await audio.play();
			}
		});

		mediaSession.setActionHandler('pause', async () => {
			if (currentTrack === track && isPlaying) {
				audio.pause();
			}
		});

		const tracks: Track[] = [];

		album.discs.forEach((disc) => {
			tracks.push(...disc.tracks);
		});

		const position = tracks.indexOf(track);

		if (position >= 0) {
			if (position > 0) {
				mediaSession.setActionHandler('previoustrack', async () => {
					await playOtherTrack(
						album,
						disc,
						tracks[position - 1],
						cids,
						undefined,
						undefined
					);
				});
			}

			if (position < (tracks.length - 1)) {
				mediaSession.setActionHandler('nexttrack', async () => {
					await playOtherTrack(
						album,
						disc,
						tracks[position + 1],
						cids,
						undefined,
						undefined
					);
				});
			}
		}
	}
}
*/

function AlbumView(album: Album, cids: CIDMap): HTMLElement {
	if (views.has(album)) {
		return views.get(album) as HTMLElement;
	}

	const view = document.createElement('main');
	views.set(album, view);
	view.classList.add('view');

	const template = html`
		${
			! ('art' in album)
				? ''
				: html`<ol class="covers">${
					(album as AlbumWithArt).art.covers.map((cover) => {
						return html`<li><ocremix-image
							.cidMap=${cids}
							.source=${cover}
						></ocremix-image></li>`
					})
				}</ol>`
		}
		<ocremix-track-queue
			.target=${playTarget}
		>${album.discs.sort((a, b) => {
			return a.index - b.index;
		}).map((disc) => {
			return html`
				<ocremix-track-queue-group
					name="${disc.name}"
					.tracks=${disc.tracks.map(
						(track): [Track, Album, CIDMap, ImageSource[]] => {
							return [track, album, cids, disc.art];
						}
					)}
				></ocremix-track-queue-group>
			`;
		})}</ocremix-track-queue>
		${
			! ('art' in album)
				? ''
				: html`<ocremix-image
					class="bg"
					placeholder="Loading..."
					.cidMap=${cids}
					.source=${(album as AlbumWithArt).art.background}
					></ocremix-image>`
		}
	`;

	render(template, view);

	return view;
}

export async function albumView(
	albumId: string
): Promise<[HTMLElement, Album]|undefined> {
	if (albumId in Albums) {
		const { album, cids } = await Albums[albumId]();

		return [AlbumView(album, cids), album];
	}

	return;
}
