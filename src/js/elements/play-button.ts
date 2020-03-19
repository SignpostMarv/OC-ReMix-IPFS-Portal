import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';
import {
	PlayTarget,
	PlayTargetTrack,
} from '../utilities/play-target.js';
import { target } from '../utilities/default-target.js';
import {
	PlaceholderAlbum,
} from '../data/placeholders';

@customElement('ocremix-play-button')
export class PlayButton extends LitElement
{
	@property()
	playTargetTrack: PlayTargetTrack = [
		PlaceholderAlbum,
		{name: '', subpath: '', index: -1, credits: []},
		[],
		{},
		undefined,
		[],
	];

	@property()
	label = '';

	@property()
	target: PlayTarget = target;

	@property()
	disabled = false;

	createRenderRoot(): PlayButton
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
			this.playTargetTrack,
			() => { this.disabled = false; },
			() => { this.disabled = true; },
			() => { this.disabled = false; }
		);
	}
}
