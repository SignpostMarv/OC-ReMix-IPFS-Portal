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
import { AlbumWithArt } from 'ocremix-data/src/module';

async function* yieldPlaceholderThenMaybePicture(
	link: AlbumLink,
	placeholder = 'Loading...'
): AsyncGenerator<string|TemplateResult> {
	yield placeholder;

	if ( ! (link.id in Albums)) {
		yield 'Error...';

		return;
	}

	const {album, cids} = await Albums[link.id]();

	link.name = album.name;

	if ('art' in album) {
		yield html`<ocremix-image
				.cidMap=${cids}
				.source=${(album as AlbumWithArt).art.covers[0]}
			></ocremix-image>`;
	} else {
		yield album.id.replace(/^(.{4})(.{4})$/, '$1-$2');
	}
}

@customElement('ocremix-album-link')
export class AlbumLink extends LitElement
{
	@property()
	id = '';

	@property()
	name = 'Loading...';

	createRenderRoot(): AlbumLink
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<a
				class="entry"
				href="#album/${this.id}"
				data-name="${this.id}"
				aria-label="View &quot;${
						this.name !== 'Loading...'
							? this.name
							: this.id
					}&quot;"
			>${asyncReplace(yieldPlaceholderThenMaybePicture(this))}</a>
		`;
	}
}
