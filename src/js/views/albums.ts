import {
	html,
	render,
	TemplateResult,
} from 'lit-html';
import {
	asyncAppend,
} from 'lit-html/directives/async-append';
import {
	AlbumsIterator,
} from '../data/albums.js';
import {
	updateTitleSuffix,
} from '../utilities/elements.js';

const albums = document.createElement('main');

albums.classList.add('albums');

async function* MapAlbumsToLinks(): AsyncGenerator<TemplateResult> {
	for await (const album of AlbumsIterator()) {
		yield html`
			<ocremix-album-link
				.album=${album}
			></ocremix-album-link>`;
	}
}

render(
	html`
		${asyncAppend(MapAlbumsToLinks())}
	`,
	albums
);

export async function albumsView(): Promise<HTMLElement> {
	updateTitleSuffix('');

	return albums;
}
