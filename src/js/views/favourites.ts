import {
	updateTitleSuffix,
} from '../utilities/elements';
import {
	GetFavourites,
} from '../data/favourites';
import {
	Albums,
} from '../data/albums';
import {
	Disc,
	Track,
	CIDMap,
	AlbumWithArt
} from '../../module';
import {
	render,
	html,
	TemplateResult,
} from 'lit-html';
import {
	target,
} from './audio';

const main = document.createElement('main');

main.classList.add('view');

export async function favouritesView(): Promise<HTMLElement> {
	updateTitleSuffix('Favourites');

	const favourites = GetFavourites();

	const discs: {[discRef: string]: Disc} = {};

	const albumOrder = [];

	const albums: {
		[id: string]: {
			[discRef: string]: [
				Track,
				CIDMap,
			][];
		};
	} = {};

	let count = 0;

	for (const favourite of favourites) {
		const [albumId, discIndex, trackIndex] = favourite;

		if ( ! (albumId in Albums)) {
			continue;
		}

		if ( ! (albumId in albums)) {
			albums[albumId] = {};
			albumOrder.push(albumId);
		}

		const { album, cids } = await Albums[albumId]();

		for (const disc of album.discs) {
			if (discIndex === disc.index) {
				const discRef = `disc-${albumId}-${discIndex}`;

				if ( ! (discRef in albums[albumId])) {
					discs[discRef] = disc;
					albums[albumId][discRef] = [];
				}

				for (const track of disc.tracks) {
					if (trackIndex === track.index) {
						albums[albumId][discRef].push([
							track,
							cids,
						]);

						++count;

						break;
					}
				}
			}
		}
	}

	const queues: TemplateResult[] = [];

	for (const albumId of albumOrder) {
		const { album } = await Albums[albumId]();

		for (
			const discRef of Object.keys(albums[albumId]).sort(
				(a, b) => discs[a].index - discs[b].index
			)
		) {
			const disc = discs[discRef];
			const background =
				disc.background ||
				(
					('art' in album)
						? (album as AlbumWithArt).art.background
						: undefined
				);

			let name = album.name;

			if ('' !== disc.name) {
				name += ` - ${disc.name}`;
			}

			queues.push(html`
				<ocremix-track-queue-group
					name="${name}"
					.tracks=${albums[albumId][discRef].map(trackRef => {
						return [
							trackRef[0],
							album,
							trackRef[1],
							disc.art,
							background,
						];
					})}
				></ocremix-track-queue-group>
			`);
		}
	}

	render(
		html`${
			count <= 0
				? html`
					<p>No Favourites Yet!</p>
				`
				: html`
					<ocremix-track-queue
						.target=${target}
					>${queues}</ocremix-track-queue>
				`
		}`,
		main
	);

	return main;
}
