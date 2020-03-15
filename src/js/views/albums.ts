import {
	html,
	render,
	TemplateResult,
} from 'lit-html';
import {
	Albums,
} from '../data/albums.js';
import {
	updateTitleSuffix,
} from '../utilities/elements.js';

const albums = document.createElement('main');

albums.classList.add('albums');

render(html`${
	Object.keys(Albums).map((id): TemplateResult => {
		return html`<ocremix-album-link id="${id}"></ocremix-album-link>`;
	})
}`, albums);

export async function albumsView(): Promise<HTMLElement> {
	updateTitleSuffix('');

	return albums;
}
