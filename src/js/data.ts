import {
	SupportedExtensionUpperOrLower,
	SupportedExtensionLower,
	Track,
	SrcsetSource,
	CIDMap,
} from '../module';
import {GetIpfsInstance} from './ipfs.js';
import {mimeType} from './mimeType.js';

const blobs: {[key: string]: Promise<Blob>} = {};
const urls: WeakMap<Track|SrcsetSource, Promise<string>> = new WeakMap();

export function pathCID(
	path: string,
	ocremix: CIDMap
): string {
	if ( ! (path in ocremix)) {
		throw new Error(
			'album + track combo not found in ocremix payload: ' +
			path
		);
	}

	return ocremix[path];
}

export async function ocremixCache(): Promise<Cache> {
	return await caches.open('ocremix-ipfs-by-cid');
}

export async function fetchBlobViaCacheOrIpfs(
	path: string,
	skipCache = false,
	ocremix: CIDMap
): Promise<Blob> {
	const match = /.(mp3|png|jpe?g)$/i.exec(path);
	const cid = pathCID(path, ocremix);
	const buffs: Array<Uint8Array> = [];

	if ( ! match) {
		throw new Error('Unsupported file type requested!');
	}

	const [, EXT] = match;

	const ext = (
		(
			EXT as SupportedExtensionUpperOrLower
		).toLowerCase() as SupportedExtensionLower
	);

	if ('caches' in window && ! skipCache) {
		const [
			cache,
		] = await Promise.all([
			ocremixCache(),
		]);
		const url = '/ipfs/' + ocremix[path];
		const faux = new Request(url);
		const maybe: Response|undefined = await cache.match(faux);

		const cacheBlob = maybe
			? await maybe.blob()
			: await fetchBlobViaCacheOrIpfs(path, true, ocremix)

		if ( ! maybe) {
			await cache.put(url, new Response(cacheBlob));
		}

		return cacheBlob;
	}

	for await (const buff of (await GetIpfsInstance()).cat(cid)) {
		buffs.push(buff);
	}

	return new Blob(buffs, {type: mimeType(ext)});
}

export async function albumTrackCID(
	track: Track,
	ocremix: CIDMap
): Promise<string> {
	return pathCID(track.subpath, ocremix);
}

export async function blob(
	path: string,
	ocremix: CIDMap
): Promise<Blob> {
	const cid = await pathCID(path, ocremix);

	if ( ! (cid in blobs)) {
		blobs[cid] = new Promise((yup, nope) => {
			try {
				(async (): Promise<Blob> => {
					return await fetchBlobViaCacheOrIpfs(
						path,
						undefined,
						ocremix
					);
				})().then(yup);
			} catch (err) {
				nope(err);
			}
		});
	}

	return await blobs[cid];
}

export async function url(
	path: string,
	cids: CIDMap
): Promise<string> {
	return URL.createObjectURL(await blob(path, cids));
}

export async function urlForThing(
	thing: Track|SrcsetSource,
	path: string,
	cids: CIDMap
): Promise<string> {
	if ( ! urls.has(thing)) {
		urls.set(thing, url(path, cids));
	}

	return await (urls.get(thing) as Promise<string>);
}
