import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';
import {
	asyncReplace,
} from 'lit-html/directives/async-replace';
import {
	Albums,
} from '../data/albums';
import {
	AlbumWithArt, Album
} from '../../module';
import {
	PlaceholderAlbum
} from '../data/placeholders';

async function* yieldPlaceholderThenMaybePicture(
	link: AlbumLink,
	placeholder = 'Loading...'
): AsyncGenerator<string|TemplateResult> {
	yield placeholder;

	const catalogId = link.album.catalogNumber.replace(/-/g, '');

	if ( ! (catalogId in Albums)) {
		yield 'Error...';

		return;
	}

	const {album, cids} = await Albums[catalogId]();

	if ('art' in album) {
		yield html`<ocremix-image
				.cidMap=${cids}
				.source=${(album as AlbumWithArt).art.covers[0]}
			></ocremix-image>`;
	} else {
		yield album.catalogNumber;
	}
}

@customElement('ocremix-album-link')
export class AlbumLink extends LitElement
{
	@property()
	album: Album = PlaceholderAlbum;

	createRenderRoot(): AlbumLink
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<a
				class="entry"
				href="#album/${this.album.catalogNumber}"
				data-name="${this.album.name}"
				aria-label="View &quot;${this.album.name}&quot;"
			>${asyncReplace(yieldPlaceholderThenMaybePicture(this))}</a>
		`;
	}
}
