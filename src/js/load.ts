import { handleView } from './views.js';
import { target } from './utilities/default-target.js';

export * from './elements/album-link.js';
export * from './elements/image-source.js';
export * from './elements/play-button.js';
export * from './elements/download-button.js';
export * from './elements/track.js';
export * from './elements/queue.js';
export * from './elements/favourite-button.js';

(async (): Promise<void> => {
	const back: HTMLAnchorElement|null = document.querySelector(
		'body > header a#load-albums'
	);

	if ( ! (back instanceof HTMLAnchorElement)) {
		throw new Error('Could not find back button');
	}

	function swapMain(useThisInstead: HTMLElement, allowBack = true): void {
		for (const toRemove of document.querySelectorAll('body > main')) {
			if (toRemove !== useThisInstead) {
				document.body.removeChild(toRemove);
			}
		}

		document.body.appendChild(useThisInstead);

		if (allowBack) {
			(back as HTMLAnchorElement).classList.remove('disabled');
		} else {
			(back as HTMLAnchorElement).classList.add('disabled');
		}
	}

	async function handleHash(hash: string): Promise<void> {
		swapMain(
			await handleView(hash, target),
			('#' !== hash && '' !== hash)
		);
	}

	addEventListener('hashchange', () => {
		handleHash(location.hash);
	});

	handleHash(location.hash);
})();
