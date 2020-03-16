import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';
import {
	Favourite,
	IsFavourite,
	AddFavourite,
	RemoveFavourite,
} from '../data/favourites.js';

@customElement('ocremix-favourite-button')
export class FavouriteButton extends LitElement
{
	@property()
	favourite: Favourite = ['', -1, -1];

	createRenderRoot(): FavouriteButton
	{
		return this;
	}

	render(): TemplateResult
	{
		const isFavourite = IsFavourite(this.favourite);

		return html`
			<button
				type="button"
				role="switch"
				aria-checked="${isFavourite ? 'on' : 'off'}"
				@click=${this.handleClick}
				title="Add to favourites"
			>${isFavourite ? '☑' : '☐'}</button>
		`;
	}

	async handleClick(): Promise<void>
	{
		const on = ! IsFavourite(this.favourite);

		if (on) {
			AddFavourite(this.favourite);
		} else {
			RemoveFavourite(this.favourite);
		}

		await this.requestUpdate();
	}
}
