import {
	updateTitleSuffix,
} from './utilities/elements.js';
import { PlayTarget } from './utilities/play-target.js';

const albumHashRegex = /^#album\/(OCRA-?\d{4})$/;

const cssPreloads: {[regex: string]: HTMLLinkElement[]} = {};
const cssRegex: {[regex: string]: RegExp} = {};
const cssDone: WeakSet<RegExp> = new WeakSet();

([...document.head.querySelectorAll(
	'link[rel="preload"][as="style"][data-regex]'
)] as HTMLLinkElement[]).forEach(link => {
	const regexStr = link.dataset.regex as string;
	if ( ! (regexStr in cssPreloads)) {
		cssPreloads[regexStr] = [];
		cssRegex[regexStr] = new RegExp(regexStr);
	}

	cssPreloads[regexStr].push(link);
});

const views: Array<(
	hash: string,
	target: PlayTarget
) => Promise<HTMLElement|undefined>> = [];

views.push(async (hash: string): Promise<HTMLElement|undefined> => {
	if ( ! /^#?$/.test(hash)) {
		return;
	}

	const { albumsView } = await import('./views/albums.js');

	return await albumsView();
});

views.push(async (hash: string): Promise<HTMLElement|undefined> => {
	if ( ! /^#app$/.test(hash)) {
		return;
	}

	const { updateAppInfo } = await import('./views/app-info.js');

	return await updateAppInfo();
});
views.push(async (
	hash: string,
	target: PlayTarget
): Promise<HTMLElement|undefined> => {
	if ( ! /^#favourites$/.test(hash)) {
		return;
	}

	const { favouritesView } = await import('./views/favourites.js');

	return await favouritesView(target);
});
views.push(async (
	hash: string,
	target: PlayTarget
): Promise<HTMLElement|undefined> => {
	const maybe = albumHashRegex.exec(hash);

	if ( ! maybe) {
		return;
	}

	const { albumView } = await import('./views/album.js');

	const result = await albumView(maybe[1], target);

	if ( ! result) {
		return;
	}

	const [
		view,
		album,
	] = result;

	if (location.hash === hash) {
		/*
		currentAlbum = album;
		*/

		updateTitleSuffix(album.name);

		return view;
	} else {
		console.info(
			'hash changed while album data was being loaded'
		);
	}

	return;
});
views.push(async (): Promise<HTMLElement> => {
	const { notFound } = await import('./views/not-found.js');

	return await notFound();
});

export async function handleView(
	hash: string,
	target: PlayTarget
): Promise<HTMLElement> {
	target.background.hidden = true;
	target.covers.hidden = true;

	for (const regexStr of Object.keys(cssRegex)) {
		const cssRegexObj = cssRegex[regexStr];

		if (cssRegexObj.test(hash) && ! cssDone.has(cssRegexObj)) {
			console.log(regexStr, cssRegexObj, hash);
			cssDone.add(cssRegexObj);

			cssPreloads[regexStr].forEach(link => {
				link.rel = 'stylesheet';
			});
		}
	}

	for await (const maybe of views) {
		const result = await maybe(hash, target);

		if (result) {
			return result;
		}
	}

	throw new Error('Could not resolve hash to view');
}
