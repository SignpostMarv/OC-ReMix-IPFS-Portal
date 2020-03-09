import {
	Album,
	Track,
} from '../../module';
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
} from '../../lit-html/lit-html.js';
import {
	asyncAppend
} from '../../lit-html/directives/async-append.js';
import {
	yieldAlbumBackground, yieldAlbumCovers
} from '../utilities/elements.js';

let currentTrack: Track|undefined;

const views: WeakMap<Album, HTMLElement> = new WeakMap();
const audio = ((): HTMLAudioElement => {
	const audio = document.createElement('audio');

	audio.controls = true;
	audio.src=  '';

	audio.addEventListener('ended', () => {
		currentTrack = undefined;
	});

	return audio;
})();

let trackMostRecentlyAttemptedToPlay: string|undefined;

document.body.appendChild(audio);

function play(src: string): void {
	console.log(src);
	if (audio.src !== src) {
		audio.pause();
		audio.src = src;
	}
	audio.play();
}

function AlbumViewClickFactory(
	album: Album,
	track: Track
): (e: Event) => Promise<void> {
	const path = album.path + track.subpath;

	return async (e: Event): Promise<void> => {
		const button = e.target as HTMLButtonElement;

		if (currentTrack === track) {
			audio.pause();
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
		}
	};
}

function AlbumView(album: Album): HTMLElement {
	if (views.has(album)) {
		return views.get(album) as HTMLElement;
	}

	const view = document.createElement('main');
	views.set(album, view);
	view.classList.add('view');

	const template = html`
		<ol class="covers">${asyncAppend(yieldAlbumCovers(album))}</ol>
		<dl class="discs">${Object.entries(album.discs).map((disc) => {
			const [discName, tracks] = disc;

			async function* yieldTracks(): AsyncGenerator<TemplateResult> {
				for await (const template of  tracks.map(
					async (track): Promise<TemplateResult> => {
						const cid = await albumTrackCID(album, track);
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
								${track.name}
								<a
									class="as-button"
									data-cid="${cid}"
									download="${filename}"
									title="Download ${filename}"
								>🔽</a>
							</li>
						`;
					}
				)) {
					yield template;
				}

				tracks.forEach(async (track) => {
					const cid = await albumTrackCID(album, track);

					const trackEntry = view.querySelector(
						`[download][data-cid="${cid}"]`
					);

					if ( ! (trackEntry instanceof HTMLAnchorElement)) {
						throw new Error('Could not find track entry!');
					}

					trackEntry.href = await urlForThing(
						track,
						album.path + track.subpath
					);
				});
			}

			return html`
				<dt>${discName}</dt>
				<dd>
					<ol class="tracks">${asyncAppend(yieldTracks())}</ol>
				</dd>
			`;
		})}</dl>
		${asyncAppend(yieldAlbumBackground(album))}
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
