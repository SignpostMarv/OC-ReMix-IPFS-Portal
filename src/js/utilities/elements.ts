import {
	html,
	render,
} from 'lit-html';

const title = document.head.querySelector('title');

if ( ! title) {
	throw new Error('Could not locate title element!');
}

const initialTitle = title.textContent;

export function updateTitleSuffix(suffix: string): void {
	render(
		html`${
			('' === suffix.trim())
				? html`${initialTitle}`
				: html`${initialTitle} | ${suffix.trim()}`
		}`,
		title as HTMLTitleElement
	);
}
