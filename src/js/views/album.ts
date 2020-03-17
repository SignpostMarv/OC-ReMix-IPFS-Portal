import {
	Album,
	AlbumWithArt,
	CIDMap,
} from '../../module';
import {
	Albums,
} from '../data/albums.js';
import {
	html,
	render,
} from 'lit-html';
import {
	PlayTargetTrack, PlayTarget,
} from '../utilities/play-target';

const views: WeakMap<Album, HTMLElement> = new WeakMap();

function AlbumView(
	album: Album,
	cids: CIDMap,
	target: PlayTarget
): HTMLElement {
	if (views.has(album)) {
		return views.get(album) as HTMLElement;
	}

	const view = document.createElement('main');
	views.set(album, view);
	view.classList.add('view');

	target.background.hidden = true;

	if ('art' in album) {
		target.background.placeholder = '';
		target.background.cidMap = cids;
		target.background.source = (album as AlbumWithArt).art.background;
		target.background.hidden = false;
		target.covers.sources = [cids, (album as AlbumWithArt).art.covers];
		target.covers.hidden = false;
	}

	const template = html`
		<ocremix-track-queue
			.target=${target}
		>${album.discs.sort((a, b) => {
			return a.index - b.index;
		}).map((disc) => {
			const background = (
				disc.background ||
				(
					('art' in album)
						? (album as AlbumWithArt).art.background
						: undefined
				)
			);

			const covers = (
				('art' in album)
					? (album as AlbumWithArt).art.covers
					: []
			);

			return html`
				<ocremix-track-queue-group
					name="${disc.name}"
					.tracks=${disc.tracks.map(
						(track): PlayTargetTrack => {
							return [
								album,
								track,
								disc.art,
								cids,
								background,
								covers
							];
						}
					)}
				></ocremix-track-queue-group>
			`;
		})}</ocremix-track-queue>
	`;

	render(template, view);

	return view;
}

export async function albumView(
	albumId: string,
	target: PlayTarget
): Promise<[HTMLElement, Album]|undefined> {
	if (albumId in Albums) {
		const { album, cids } = await Albums[albumId]();

		return [AlbumView(album, cids, target), album];
	}

	return;
}
