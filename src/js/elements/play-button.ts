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
	ImageSource,
	Album,
} from '../../module';
import {
	PlayTarget,
	DummyTarget,
} from '../utilities/play-target.js';

@customElement('ocremix-play-button')
export class PlayButton extends LitElement
{
	@property()
	track: Track = {name: '', subpath: '', index: -1, credits: []};

	@property()
	album: Album = {name: '', id: '', path: '', discs: [], credits: {
		directors: [],
		composers: [],
		arrangers: [],
		artwork: [],
	}};

	@property()
	cidMap: CIDMap = {};

	@property()
	art: ImageSource[] = [];

	@property()
	label = '';

	@property()
	target: PlayTarget = DummyTarget;

	@property()
	disabled = false;

	createRenderRoot()
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<button
				type="button"
				aria-label="${this.label}"
				?disabled=${this.disabled}
				@click=${this.handleClick}
			>${this.disabled ? '⏳' : '⏯'}</button>
		`;
	}

	async handleClick(): Promise<void>
	{
		this.target.play(
			[this.album, this.track, this.art, this.cidMap],
			() => { this.disabled = false; },
			() => { this.disabled = true; },
			() => { this.disabled = false; }
		);
	}
}
