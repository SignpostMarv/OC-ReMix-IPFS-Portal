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
import { TrackElement } from './track';
import { target } from '../utilities/default-target.js';

@customElement('ocremix-track-queue-group')
export class TrackQueueGroup extends LitElement
{
	@property()
	name = '';

	@property()
	tracks: PlayTargetTrack[] = [];

	@property()
	target: PlayTarget = target;

	createRenderRoot(): TrackQueueGroup
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`
			<header>${this.name}</header>
			<section class="tracks">${this.tracks.map((item): TemplateResult => {
				return html`${TrackElement.FromPlayTargetTrack(item)}`;
			})}</section>
		`;
	}
}

@customElement('ocremix-track-queue')
export class Queue extends LitElement
{
	@property()
	target: PlayTarget = target;

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

		console.log('is dummy', this.target === target);

		this.target.otherTracks = ([
			...this.querySelectorAll('ocremix-track')
		].filter((track) => {
			return track instanceof TrackElement;
		}) as TrackElement[]).map((track): PlayTargetTrack => {
			return [
				track.album,
				track.track,
				track.art,
				track.cidMap,
				track.background,
				track.covers,
			];
		});
	}
}
