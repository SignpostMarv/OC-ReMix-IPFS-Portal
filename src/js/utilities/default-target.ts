import { audio } from '../views/audio.js';
import { background } from '../views/background.js';
import { covers } from '../views/covers.js';
import { PlayTarget } from './play-target.js';

export const target = new PlayTarget(
	audio,
	background,
	covers,
	false
);
