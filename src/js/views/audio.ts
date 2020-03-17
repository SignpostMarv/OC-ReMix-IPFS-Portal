const element = document.querySelector('audio');

if ( ! element) {
	throw new Error('audio element not present!');
}

element.controls = true;
element.src = '';

export const audio = element;
