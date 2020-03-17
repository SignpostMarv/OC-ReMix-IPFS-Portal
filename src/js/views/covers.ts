import { ImageSourceList } from '../elements/image-source';

const element: ImageSourceList|null = document.querySelector(
	'ocremix-image-list'
);

if ( ! element) {
	throw new Error('covers element not present!');
}

element.hidden = true;

export const covers = element;
