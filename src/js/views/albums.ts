import {
	html,
	render,
	TemplateResult,
} from 'lit-html';
import {
	asyncAppend
} from 'lit-html/directives/async-append.js';
import {
	asyncReplace
} from 'lit-html/directives/async-replace.js';
import {
	Albums, AlbumResult,
} from '../data/albums.js';
import {
	yieldPlaceholderThenPicture,
	updateTitleSuffix,
} from '../utilities/elements.js';
import { AlbumWithArt } from '../../module';

const albums = document.createElement('main');

albums.classList.add('albums');

async function AddAlbum(
	result: AlbumResult,
	albumId: string
): Promise<TemplateResult> {
	const { album, cids } = result;

	const button = html`<a
		class="entry"
		href="#album/${albumId}"
		data-name="${album.name}"
		aria-label="View &quot;${album.name}&quot;"
	>${
		! ('art' in album)
			? album.id.replace(/^(.{4})(.{4})$/, '$1-$2')
			: asyncReplace(yieldPlaceholderThenPicture(
				'Loading...',
				(album as AlbumWithArt).art.covers[0],
				cids
			))}</a>`;

	return button;
}

async function* renderAlbums(): AsyncGenerator<TemplateResult> {
	for (const [albumId, albumGetter] of Object.entries(Albums)) {
		yield await albumGetter().then((album) => {
			return AddAlbum(album, albumId);
		})
	}
}

render(html`${asyncAppend(renderAlbums())}`, albums);

export async function albumsView(): Promise<HTMLElement> {
	updateTitleSuffix('');

	return albums;
}
