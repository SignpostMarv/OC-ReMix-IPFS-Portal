import {
	Album,
} from '../../module';
import {
	AlbumSystems,
} from './album-systems';

declare type SysteImageCallback = () => HTMLPictureElement;

function ImagesToPicture(icon: string): HTMLPictureElement {
	const picture = document.createElement('picture');
	const [
		img,
		webpSource,
		pngSource,
	] = [
		new Image(),
		document.createElement('source'),
		document.createElement('source'),
	];

	const [
		webp,
		png,
	] = [
		`./node_modules/@signpostmarv/gamicons/icons/${icon}.webp`,
		`./node_modules/@signpostmarv/gamicons/icons/${icon}.png`,
	];

	webpSource.type = 'image/webp';
	webpSource.srcset = `${webp} 16w`;

	pngSource.type = 'image/png';
	pngSource.srcset = `${png} 16w`;

	img.width = img.height = 16;
	img.src = `${png}`;

	[img, webpSource, pngSource].forEach(append => {
		picture.appendChild(append);
	});

	return picture;
}

const Systems: {[id: string]: SysteImageCallback} = {
	'gb': () => { return ImagesToPicture('gb'); },
	'gbc': () => { return ImagesToPicture('gbc'); },
	'gcn': () => { return ImagesToPicture('gcn'); },
	'gen': () => { return ImagesToPicture('gen'); },
	'nes': () => { return ImagesToPicture('nes'); },
	'n64': () => { return ImagesToPicture('n64'); },
	'snes': () => { return ImagesToPicture('snes'); },
	'wii': () => { return ImagesToPicture('wii'); },
};

export async function AlbumSystemImages(
	album: Album
): Promise<HTMLPictureElement[]> {
	const pictures: HTMLPictureElement[] = [];
	const systems = await AlbumSystems(album);

	for (const system of systems) {
		if (system.id in Systems) {
			pictures.push((Systems[system.id] as SysteImageCallback)());
		}
	}

	return pictures;
}
