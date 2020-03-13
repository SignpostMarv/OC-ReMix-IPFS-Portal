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
} from '../../module.js';
import {
	albumTrackCID,
	urlForThing,
} from '../data.js';
import {
	Albums,
} from '../../data/albums.js';
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

let trackMostRecentlyAttemptedToPlay: string|undefined;

document.body.appendChild(audio);

function play(src: string): void {
	console.log(src);
	if (audio.src !== src) {
		if (isPlaying) {
		audio.pause();
		}
		audio.src = src;
	}
	audio.play();
}

async function AlbumToMediaMetadataArt(
	album: AlbumWithArt
): Promise<Array<MediaMetadataArtwork>> {
	const out: Array<MediaMetadataArtwork> = [];

	return await Promise.all(album.art.covers.concat([album.art.background]).map(
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

function AlbumViewClickFactory(
	album: Album,
	track: Track
): (e: Event) => Promise<void> {
	const path = album.path + track.subpath;

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

		const cid = await albumTrackCID(album, track);

		button.disabled = true;
		button.textContent = '⏳';
		trackMostRecentlyAttemptedToPlay = cid;

		const trackUrl = await urlForThing(
			track,
			path
		);

		button.disabled = false;
		button.textContent = '⏯';

		if (cid === trackMostRecentlyAttemptedToPlay) {
			currentTrack = track;
			play(trackUrl);

			if ('mediaSession' in navigator) {
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
						! ('art' in album)
							? []
							: await AlbumToMediaMetadataArt(
								album as AlbumWithArt
							)
					),
				});
				(
					navigator as MediaSessionNavigator
				).mediaSession.metadata = metadata;
			}
		}
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
		<dl class="discs">${Object.entries(album.discs).map((disc) => {
			const [discName, tracks] = disc;

			return html`
				<dt>${discName}</dt>
				<dd>
					<ol class="tracks">${tracks.map(
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
