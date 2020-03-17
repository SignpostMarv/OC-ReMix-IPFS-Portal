import { ImageSourceElement } from '../elements/image-source';

const element: ImageSourceElement|null = document.querySelector(
	'ocremix-image.bg'
);

if ( ! element) {
	throw new Error('background element not present!');
}

element.hidden = true;

export const background = element;
