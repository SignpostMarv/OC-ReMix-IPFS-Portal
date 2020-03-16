import {
	Album,
	Track,
} from '../../module';

import {
	Favourite,
} from '../data/favourites.js';

export function SerialiseTrack(
	album: Album,
	track: Track
): Favourite {
	let discIndex = -1;

	for (const disc of album.discs) {
		const trackIndex = disc.tracks.indexOf(track);

		if (trackIndex >= 0) {
			discIndex = disc.index;

			break;
		}
	}

	if (discIndex < 0) {
		throw new Error('track not found on disc in album!');
	}

	return [album.id, discIndex, track.index];
}
