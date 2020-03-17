import {
	Album,
	AlbumWithArt,
	CIDMap,
	Track,
	ImageSource,
} from '../../module';
import {
	Albums,
} from '../data/albums.js';
import {
	html,
	render,
} from 'lit-html';
import {
	target as playTarget,
} from './audio';

const views: WeakMap<Album, HTMLElement> = new WeakMap();

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
