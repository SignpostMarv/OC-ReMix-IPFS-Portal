import {
	ImageSource,
	CIDMap,
} from '../../module';
import {
	TemplateResult,
	html,
	render,
} from 'lit-html';
import {
	urlForThing,
} from '../data.js';
import {
	AlbumWithArt,
} from '../../module';

const title = document.head.querySelector('title');

if ( ! title) {
	throw new Error('Could not locate title element!');
}

const initialTitle = title.textContent;

export async function picture(
	art: ImageSource,
	ocremix: CIDMap,
	className = ''
): Promise<HTMLPictureElement> {
	const src = await urlForThing(art, art.subpath, ocremix);
	const srcset = await Promise.all(art.srcset.map(
		async (srcset): Promise<string> => {
			const srcsetSrc = await urlForThing(
				srcset,
				srcset.subpath,
				ocremix
			);

			return srcsetSrc + ' ' + srcset.width.toString(10) + 'w';
		}
	));
	const picture = document.createElement('picture');
	const img = new Image();

	if (srcset.length > 0) {
		srcset.push(src + ' ' + art.width.toString(10) + 'w');
	}

	img.src = src;
	img.width = art.width;
	img.height = art.height;
	if (srcset.length > 0) {
		img.srcset = srcset.join(', ');
	}

	picture.appendChild(img);

	picture.className = className;

	return picture;
}

export async function* yieldPlaceholderThenPicture(
	placeholder: string,
	art: ImageSource,
	ocremix: CIDMap
): AsyncGenerator<string|HTMLPictureElement> {
	yield placeholder;

	yield await picture(art, ocremix);
}

export async function* yieldAlbumCovers(
	album: AlbumWithArt,
	ocremix: CIDMap
): AsyncGenerator<TemplateResult> {
	for await (const appendPicture of album.art.covers.map(
		(cover): Promise<HTMLPictureElement> => {
			return picture(cover, ocremix);
		}
	)) {
		yield html`<li>${appendPicture}</li>`;
	}
}

export async function* yieldAlbumBackground(
	album: AlbumWithArt,
	ocremix: CIDMap
): AsyncGenerator<HTMLPictureElement> {
	yield await picture(album.art.background, ocremix, 'bg');
}

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
