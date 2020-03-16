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
	Album,
	ImageSource,
} from '../../module';
import {
	PlayTarget,
	DummyTarget,
} from '../utilities/play-target.js';
import { TrackElement } from './track';

@customElement('ocremix-track-queue-group')
export class TrackQueueGroup extends LitElement
{
	@property()
	name = '';

	@property()
	tracks: [Track, Album, CIDMap, ImageSource[]][] = [];

	@property()
	target: PlayTarget = DummyTarget;

	createRenderRoot(): TrackQueueGroup
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<header>${this.name}</header>
			<section class="tracks">${this.tracks.map((item): TemplateResult => {
				const [track, album, cids, art] = item;
				return html`
					<ocremix-track
							.track=${track}
							.album=${album}
							.art=${art}
							.cidMap=${cids}
							.target=${this.target}
							play-label="Play or Pause ${
								track.name
							}"
						></ocremix-track>
					`;
			})}</section>
		`;
	}
}

@customElement('ocremix-track-queue')
export class Queue extends LitElement
{
	@property()
	target: PlayTarget = DummyTarget;

	createRenderRoot(): Queue
	{
		return this;
	}

	update(changedProperties: Map<'target', PlayTarget>): void
	{
		if (changedProperties.has('target'))
		{
			[
				...this.querySelectorAll('ocremix-track-queue-group')
			].forEach((e) => {
				(e as TrackQueueGroup).target = this.target;
			});
		}
	}

	render(): TemplateResult
	{
		return html`<slot></slot>`;
	}

	connectedCallback(): void
	{
		super.connectedCallback();

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.updateTargetTracksList();
			});
		});
	}

	updateTargetTracksList(): void
	{
		if ( ! this.target) {
			return;
		}

		this.target.otherTracks = ([
			...this.querySelectorAll('ocremix-track')
		].filter((track) => {
			return track instanceof TrackElement;
		}) as TrackElement[]).map((track) => {
			return [
				track.album,
				track.track,
				track.art,
				track.cidMap,
			];
		});
	}
}
