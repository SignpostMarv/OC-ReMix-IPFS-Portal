import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';
import {
	CIDMap,
	Track,
} from '../../module';
import {
	urlForThing,
} from '../data';

@customElement('ocremix-download-button')
export class DownloadButton extends LitElement
{
	@property()
	track: Track = {name: '', subpath: '', index: -1, credits: []};

	@property()
	cidMap: CIDMap = {};

	@property()
	label = '';

	@property()
	disabled = false;

	createRenderRoot(): DownloadButton
	{
		return this;
	}

	render(): TemplateResult
	{
		const filename = this.track.subpath.replace(/^(.+\/)*/, '');

		return html`
			<button
				type="button"
				aria-label="${this.label}"
				title="Prepare Download"
				@click=${this.handleClick}
			>🔽</button>
			<a
				class="as-button"
				download="${filename}"
				title="Download ${filename}"
			>⛔</a>
		`;
	}

	async handleClick(e: Event): Promise<void>
	{
		const button = e.target as HTMLButtonElement;
		const download = button.nextElementSibling;

		if ( ! (download instanceof HTMLAnchorElement)) {
			throw new Error('Could not find download button!');
		}
		download.textContent = '⏳';
		button.disabled = true;
		download.href = await urlForThing(
			this.track,
			this.track.subpath,
			this.cidMap
		);
		download.textContent = '🔽';
	}
}
