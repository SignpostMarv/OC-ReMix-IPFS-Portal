import {
	PlayTarget,
} from '../utilities/play-target';
import {
	background,
} from './background';

const element = document.querySelector('audio');

if ( ! element) {
	throw new Error('audio element not present!');
}

element.controls = true;
element.src = '';

export const audio = element;
export const target = new PlayTarget(audio, background, false);
