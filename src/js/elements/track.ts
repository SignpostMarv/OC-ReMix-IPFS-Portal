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
	CreditWithId,
	CreditWithUrl,
} from '../../module';
import {
	PlayTarget,
	PlayTargetTrack,
} from '../utilities/play-target.js';
import {
	SerialiseTrack
} from '../utilities/serialise.js';
import { target } from '../utilities/default-target';

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
		target="_blank"
		href="${
			('url' in credit)
				? credit.url
				: `https://ocremix.org/artist/${credit.id}`
		}"
	>${namedCredit(credit)}</a>`;
}

function creditToTemplateResult(credit: Credit): TemplateResult {
	return html`
		<li>${
			('string' === typeof credit)
				? credit
				: (
					! ('url' in credit || 'id' in credit)
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
		performers: [],
		artwork: [],
	}};

	@property()
	cidMap: CIDMap = {};

	@property()
	art: ImageSource[] = [];

	@property()
	background: ImageSource|undefined;

	@property()
	covers: ImageSource[] = [];

	@property({attribute: 'play-label'})
	playLabel = '';

	@property({attribute: 'download-label'})
	downloadLabel = '';

	@property()
	target: PlayTarget = target;

	createRenderRoot(): TrackElement
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<ocremix-play-button
				.playTargetTrack=${[
					this.album,
					this.track,
					this.art,
					this.cidMap,
					this.background,
					this.covers,
				] as PlayTargetTrack}
				.target=${this.target}
				label="${this.playLabel}"
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
			<ocremix-favourite-button
				.favourite=${SerialiseTrack(this.album, this.track)}
			></ocremix-favourite-button>
			<ocremix-download-button
				.track=${this.track}
				.cidMap=${this.cidMap}
				.art=${this.art}
				label="${this.downloadLabel}"
			></ocremix-download-button>
		`;
	}

	static FromPlayTargetTrack(track: PlayTargetTrack): TrackElement
	{
		const out = new TrackElement();

		[
			out.album,
			out.track,
			out.art,
			out.cidMap,
			out.background,
			out.covers,
		] = track;

		out.playLabel = `Play or Pause ${track[1].name}`;

		return out;
	}
}
