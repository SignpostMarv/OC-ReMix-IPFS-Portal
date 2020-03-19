import {
	Album,
} from '../../module';
import {
	AlbumSystems,
} from './album-systems';

declare type SysteImageCallback = () => HTMLPictureElement;

function ImagesToPicture(icon: string, alt: string): HTMLPictureElement {
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
	img.src = `${webp}`;
	img.alt = alt;

	[
		img,
		webpSource,
		pngSource,
	].forEach(append => {
		picture.appendChild(append);
	});

	return picture;
}

const Systems: {[id: string]: SysteImageCallback} = {
	'gb': () => { return ImagesToPicture('gb', 'Game Boy'); },
	'gbc': () => { return ImagesToPicture('gbc', 'Game Boy Color'); },
	'gcn': () => { return ImagesToPicture('gcn', 'GameCube'); },
	'gen': () => { return ImagesToPicture('gen', 'Mega Drive'); },
	'nes': () => { return ImagesToPicture('nes', 'NES'); },
	'n64': () => { return ImagesToPicture('n64', 'Nintendo 64'); },
	'snes': () => { return ImagesToPicture('snes', 'SNES'); },
	'wii': () => { return ImagesToPicture('wii', 'Wii'); },
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
