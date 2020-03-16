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
	BrokenTrack,
	Credit,
	ImageSource,
	Album,
	NamedCredit,
} from '../../module';
import {
	DummyTarget,
	PlayTarget,
} from '../utilities/play-target.js';
import { CreditWithId, CreditWithUrl } from 'ocremix-data/src/module';

function noFixAvailable(): TemplateResult {
	return html`
		<span
			class="as-button"
			title="${
				'This track is known to be broken' +
				', but no fix is currently available.'
			}"
		>⚠</span>
	`
}

function namedCredit(credit: NamedCredit): TemplateResult
{
	return html`${
					('string' === typeof credit.name)
						? html`${credit.name}`
						: Object.entries(credit.name).map((entry) => {
							const [lang, name] = entry;

							return html`<span lang="${lang}">${name}</span>`;
						})
	}`;
}

function urlCredit(credit: CreditWithId|CreditWithUrl): TemplateResult
{
	return html`<a
		rel="nofollow noopener"
		href="${
			('url' in credit)
				? credit.url
				: `https://ocremix.org/artist/${credit}`
		}"
	>${namedCredit(credit)}</a>`;
}

function creditToTemplateResult(credit: Credit): TemplateResult {
	return html`
		<li>${
			('string' === typeof credit)
				? credit
				: (
					! ('url' in credit)
						? namedCredit(credit)
						: urlCredit(credit)
				)
		}</li>
	`;
}

@customElement('ocremix-track')
export class TrackElement extends LitElement
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

	@property({attribute: 'play-label'})
	playLabel = '';

	@property({attribute: 'download-label'})
	downloadLabel = '';

	@property()
	target: PlayTarget = DummyTarget;

	createRenderRoot()
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<ocremix-play-button
				.track=${this.track}
				.album=${this.album}
				.art=${this.art}
				.cidMap=${this.cidMap}
				label="${this.playLabel}"
				.target=${this.target}
			></ocremix-play-button>
			<span>
			${this.track.name}
			${
				(this.track.credits.length < 1)
					? ''
					: html`
						<ul class="credits">${
							this.track.credits.map(
								creditToTemplateResult
							)
						}</ul>
					`
			}
			</span>
			${
				(
					'fixAvailable' in this.track &&
					! (this.track as BrokenTrack).fixAvailable
				)
					? noFixAvailable()
					: ''
			}
			<ocremix-download-button
				.track=${this.track}
				.cidMap=${this.cidMap}
				.art=${this.art}
				label="${this.downloadLabel}"
			></ocremix-download-button>
		`;
	}
}
