import {
	Album,
	AlbumWithArt,
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
} from '../../module';
import {
	albumTrackCID,
	urlForThing,
} from '../data.js';
import {
	Albums,
} from 'ocremix-data/src/data/albums.js';
import {
	html,
	render,
	TemplateResult,
} from 'lit-html';
import {
	asyncAppend
} from 'lit-html/directives/async-append.js';
import {
	yieldAlbumBackground, yieldAlbumCovers
} from '../utilities/elements.js';
import {
	mimeType,
} from '../mimeType.js';

let currentTrack: Track|undefined;
let isPlaying = false;

const views: WeakMap<Album, HTMLElement> = new WeakMap();
const audio = ((): HTMLAudioElement => {
	const audio = document.createElement('audio');

	audio.controls = true;
	audio.src=  '';

	audio.addEventListener('ended', () => {
		currentTrack = undefined;
	});
	audio.onplaying = (): void => {
		isPlaying = true;
	};
	audio.onpause = (): void => {
		isPlaying = false;
	}

	return audio;
})();
const preloadAlbumDiscArtPromises: WeakMap<
	Album,
	Promise<string[]>
> = new WeakMap();
const completed: WeakSet<Promise<string[]>> = new WeakSet();

async function preloadAlbumDiscArt(album: Album): Promise<string[]> {
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
				return urlForThing(source, album.path + source.subpath);
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

document.body.appendChild(audio);

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
	album: Album,
	disc: Disc
): Promise<Array<MediaMetadataArtwork>> {
	const out: Array<MediaMetadataArtwork> = [];

	return await Promise.all(disc.art.map(
		async (art): Promise<MediaMetadataArtwork> => {
			const path = album.path + art.subpath;
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
				src: await urlForThing(art, path),
				sizes: `${art.width}x${art.height}`,
				type: mimeType(ext),
			};
		}
	));

	return out;
}

async function MaybeDiscToMediaMetadataArt(
	album: Album,
	disc: Disc
): Promise<Array<MediaMetadataArtwork>> {
	const maybe = await preloadAlbumDiscArt(album);

	if (maybe.length > 0) {
		return await DiscToMediaMetadataArt(album, disc);
	}

	return [];
}

async function queueUpMediaSessionActionHandlers(
	album: Album,
	disc: Disc,
	track: Track,
	playOtherTrack: ((
		album: Album,
		disc: Disc,
		track: Track,
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
						disc
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
						undefined,
						undefined
					);
				});
			}
		}
	}
}

async function AttemptToPlayTrackFromAlbum(
	album: Album,
	disc: Disc,
	track: Track,
	beforeAttempt: undefined|(() => void) = undefined,
	beforeFetchUrl: undefined|(() => Promise<void>) = undefined
): Promise<void> {
	const path = album.path + track.subpath;

	if (beforeAttempt) {
		beforeAttempt();
	}

	const cid = await albumTrackCID(album, track);

	if (beforeFetchUrl) {
		await beforeFetchUrl();
	}

	trackMostRecentlyAttemptedToPlay = cid;

	const trackUrl = await urlForThing(track, path);

	if (cid === trackMostRecentlyAttemptedToPlay) {
		currentTrack = track;

		await play(trackUrl);

		await queueUpMediaSessionActionHandlers(
			album,
			disc,
			track,
			AttemptToPlayTrackFromAlbum
		);
	}
}

function AlbumViewClickFactory(
	album: Album,
	disc: Disc,
	track: Track
): (e: Event) => Promise<void> {
	return async (e: Event): Promise<void> => {
		const button = e.target as HTMLButtonElement;

		if (currentTrack === track) {
			if (isPlaying) {
			audio.pause();
			}
			button.textContent = '⏯';
			currentTrack = undefined;

			return;
		}

		await AttemptToPlayTrackFromAlbum(
			album,
			disc,
			track,
			(): void => {
				button.disabled = true;
				button.textContent = '⏳';
			},
			async (): Promise<void> => {
				button.disabled = false;
				button.textContent = '⏯';
			}
		);
	};
}

function AlbumViewDownloadFactory(
	album: Album,
	track: Track
): (e: Event) => Promise<void> {
	return async (e: Event): Promise<void> => {
		const button = e.target as HTMLButtonElement;
		const download = button.nextElementSibling;

		if ( ! (download instanceof HTMLAnchorElement)) {
			throw new Error('Could not find download button!');
		}
		download.textContent = '⏳';
		button.disabled = true;
		download.href = await urlForThing(track, album.path + track.subpath);
		download.textContent = '🔽';
	};
}

function noFixAvailable(): TemplateResult {
	return html`
		<span
			class="as-button"
			title="${
				'This track is known to be broken' +
				', but no fix is currently available.'
			}"
		>⚠</span>
	`
}

function creditToTemplateResult(credit: string|Credit): TemplateResult {
	return html`
		<li>${
			('string' === typeof credit)
				? credit
				: html`<a
					rel="nofollow noopener"
					href="${credit.url}"
					target="_blank"
				>${
					('string' === typeof credit.name)
						? html`${credit.name}`
						: Object.entries(credit.name).map((entry) => {
							const [lang, name] = entry;

							return html`<span lang="${lang}">${name}</span>`;
						})
				}</a>`
		}</li>
	`;
}

function AlbumView(album: Album): HTMLElement {
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
					asyncAppend(yieldAlbumCovers(album as AlbumWithArt))
				}</ol>`
		}
		<dl class="discs">${album.discs.sort((a, b) => {
			return a.index - b.index;
		}).map((disc) => {
			return html`
				<dt>${disc.name}</dt>
				<dd>
					<ol class="tracks">${disc.tracks.map(
						(track): TemplateResult => {
						const filename = track.subpath.replace(/^(.+\/)*/, '');

						return html`
							<li>
								<button
									type="button"
									aria-label="Play or Pause ${
										track.name
								}"
									@click=${AlbumViewClickFactory(
										album,
										disc,
										track
									)}
								>⏯</button>
								<span>
								${track.name}
								${
									(track.credits.length < 1)
										? ''
										: html`<ul class="credits">${
											track.credits.map(
												creditToTemplateResult
											)
										}</ul>`
								}
								</span>
								${
									(
										'fixAvailable' in track &&
										! (track as BrokenTrack).fixAvailable
									)
										? noFixAvailable()
										: ''
								}
								<button
									type="button"
									aria-label="Prepare download for ${
										track.name
									}"
									title="Prepare Download"
									@click=${AlbumViewDownloadFactory(
										album,
										track
									)}
								>🔽</button>
								<a
									class="as-button"
									download="${filename}"
									title="Download ${filename}"
								>⛔</a>
							</li>
						`;
						}
					)}</ol>
				</dd>
			`;
		})}</dl>
		${
			! ('art' in album)
				? ''
				: asyncAppend(yieldAlbumBackground(album as AlbumWithArt))
		}
	`;

	render(template, view);

	return view;
}

export async function albumView(
	albumId: string
): Promise<[HTMLElement, Album]|undefined> {
	if (albumId in Albums) {
		const album = await Albums[albumId]();

		return [AlbumView(album), album];
	}

	return;
}
