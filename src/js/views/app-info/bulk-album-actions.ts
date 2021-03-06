import {
	Album, CIDMap,
} from '../../../module';

import {
	ocremixCache,
	fetchBlobViaCacheOrIpfs,
	pathCID,
} from '../../data.js';
import {
	Albums
} from '../../data/albums.js';
import {
	html,
	render,
	TemplateResult,
} from 'lit-html';
import {
	asyncReplace,
} from 'lit-html/directives/async-replace.js';
import {
	AlbumWithArt,
	ImageSource
} from '../../../module';

export const appInfo = ((): HTMLElement => {
	const appInfo = document.createElement('main');

	appInfo.classList.add('app-info');

	return appInfo;
})();

export const storageEstimate = ((): HTMLTableElement => {
	const storageEstimate = document.createElement('table');

	storageEstimate.border = '1';

	return storageEstimate;
})();

export async function numberOfFilesInCache(
	files: CIDMap
): Promise<number> {
	let inCache = 0;

	if ('caches' in window) {
		const cache = await ocremixCache();

		for await(
			const isInCache of Object.values(files).map(
				(cid) => {
					const faux = new Request('/ipfs/' + cid);

					return cache.match(faux);
				}
			)
		) {
			if (isInCache) {
				++inCache;
			}
		}
	}

	return inCache;
}

export async function filesByCacheStatus(
	files: CIDMap,
	cached: boolean
): Promise<CIDMap> {
	const entries = Object.entries(files);
	const filesOfExpectedStatus: Array<string> = [];

	if ('caches' in window) {
		const cache = await ocremixCache();
		for await(
			const [path, cacheStatus] of entries.map(
				async (entry): Promise<[string, boolean]> => {
					const faux = new Request('/ipfs/' + entry[1]);

					const result = await cache.match(faux);

					return [
						entry[0],
						(result instanceof Response)
					];
				}
			)
		) {
			if (cacheStatus === cached) {
				filesOfExpectedStatus.push(path);
			}
		}
	}

	return Object.fromEntries(entries.filter((entry) => {
		return filesOfExpectedStatus.includes(entry[0]);
	}));
}

async function manuallyUpdateProgress(
	id: string,
	files: CIDMap,
	className: string,
	title: string
): Promise<void> {
	const progress = appInfo.querySelector(
		`.entry[data-album="${id}"] progress.${className}`
	);

	if ( ! (progress instanceof HTMLProgressElement)) {
		throw new Error(
			'Could not find progress bar!'
		);
	}

	const numberOfFilesInIpfs = Object.keys(files).length;

	if (numberOfFilesInIpfs > 0 && 'caches' in window) {
		const inCache = await numberOfFilesInCache(files);
		progress.value = inCache / numberOfFilesInIpfs;
		progress.title = `${title}: ${inCache} of ${numberOfFilesInIpfs}`;
	} else {
		progress.value = 0;
		progress.title = `${title}: 0 of unknown`;
	}
}

export async function* yieldFilesProgress(
	id: string,
	files: CIDMap,
	className: string,
	title: string
): AsyncGenerator<TemplateResult> {
	const entry = appInfo.querySelector(
		`.entry[data-album="${id}"]`
	);

	if ( ! (entry instanceof HTMLLIElement)) {
		throw new Error(
			'Could not find entry container!'
		);
	}

	yield html`
		<progress
			class="${className}"
			value="0"
			title="${title}: 0 of unknown"
		></progress>
	`;

	const numberOfFilesInIpfs = Object.keys(files).length;

	if (numberOfFilesInIpfs > 0 && 'caches' in window) {
		const inCache = await numberOfFilesInCache(files);

		yield html`
			<progress
				class="${className}"
				title="${title} ${inCache} of ${numberOfFilesInIpfs}"
				value="${
					(inCache / numberOfFilesInIpfs).toString()
				}"
			></progress>
		`;
	}

	const button = ('for-app' === className)
		? entry.querySelector(
			`button[data-action="get-all"]`
		)
		: entry.querySelector(
			`button[data-action="remove"]`
		);

	if ( ! (button instanceof HTMLButtonElement)) {
		throw new Error(`Could not find ${className} button!`);
	}

	button.disabled = false;
}

async function* yieldStorageEstimate(
	estimate: number
): AsyncGenerator<string> {
	yield 'calculating...';

	let divisor = 0;

	const labels = [
		'b',
		'kb',
		'mb',
		'gb',
		'tb',
	];

	const estimateDisplay = (): string => {
		return `${
			(estimate / (1024 ** divisor)).toFixed(2)
		}${
			labels[divisor]
		}`;
	}

	while (
		(estimate / (1024 ** divisor)) > 1 &&
		divisor < labels.length
	) {
		yield estimateDisplay();

		++divisor;
	}
}

export async function updateStorageEstimate(): Promise<void> {
	const estimate = await navigator.storage.estimate();

	if ( ! ('usageDetails' in estimate)) {
		render(
			html`<tbody><tr><td>n/a</td></tr></tbody>`,
			storageEstimate
		);

		return;
	}

	const usageDetails = (
		estimate as (
			StorageEstimate & {
				usageDetails: {
					[usage: string]: number;
				};
			}
		)
	).usageDetails;

	render(
		html`
			<thead>
				<tr>
					<th>Type</th>
					<th>Usage</th>
				</tr>
			</thead>
			<tbody>${
				Object.entries(usageDetails).map((usageEstimate) => {
					return html`
						<tr>
							<th scope="row">${usageEstimate[0]}</th>
							<td>${asyncReplace(yieldStorageEstimate(
								usageEstimate[1]
							))}</td>
						</tr>
					`;
				})
			}</tbody>
		`,
		storageEstimate
	)
}

export function GetAllFactory(
	filesForApp: CIDMap,
	filesInIpfs: CIDMap,
	id: string
): () => Promise<void> {
	return async (): Promise<void> => {
		const entry = appInfo.querySelector(
			`.entry[data-album="${id}"]`
		);

		if ( ! (entry instanceof HTMLLIElement)) {
			throw new Error(
				'Could not find entry container!'
			);
		}

		const button = entry.querySelector(
			`button[data-action="get-all"]`
		);
		const progressForApp = entry.querySelector(
			`progress.for-app`
		);
		const progressForIpfs = entry.querySelector(
			`progress.for-ipfs`
		);

		if ( ! (button instanceof HTMLButtonElement)) {
			throw new Error('Could not find button!');
		} else if (
			! (progressForApp instanceof HTMLProgressElement)
		) {
			throw new Error(
				'Could not find progress bar for app!'
			);
		} else if (
			! (progressForIpfs instanceof HTMLProgressElement)
		) {
			throw new Error(
				'Could not find progress bar for IPFS!'
			);
		}

		button.disabled = true;
		entry.classList.add('active');

		const notCachedForApp = await filesByCacheStatus(
			filesForApp,
			false
		);
		const numberOfFilesInIpfs = Object.keys(
			filesInIpfs
		).length;
		const numberOfFilesInApp = Object.keys(
			filesForApp
		).length;

		if (numberOfFilesInIpfs < 1) {
			button.disabled = true;
			entry.classList.remove('active');

			await updateStorageEstimate();

			return;
		}

		let numberOfCachedForIpfs = await numberOfFilesInCache(
			filesInIpfs
		);
		let numberOfCachedForApp = await numberOfFilesInCache(
			filesForApp
		);

		await Promise.all(Object.keys(notCachedForApp).map(async (path) => {
			return fetchBlobViaCacheOrIpfs(
				path,
				undefined,
				filesForApp
			).then((result) => {
				++numberOfCachedForIpfs;
				++numberOfCachedForApp;

				progressForApp.value = (
					numberOfCachedForApp / numberOfFilesInApp
				);

				progressForIpfs.value = (
					numberOfCachedForIpfs / numberOfFilesInIpfs
				);

				return result;
			});
		}));

		button.disabled = true;
		entry.classList.remove('active');

		await updateStorageEstimate();
	};
}

export function RemoveAllFactory(
	filesForApp: CIDMap,
	filesInIpfs: CIDMap,
	id: string
): () => Promise<void> {
	return async(): Promise<void> => {
		const entry = appInfo.querySelector(
			`.entry[data-album="${id}"]`
		);

		if ( ! (entry instanceof HTMLLIElement)) {
			throw new Error(
				'Could not find entry container!'
			);
		}

		const button = entry.querySelector(
			`button[data-action="remove"]`
		);

		const progressForApp = entry.querySelector(
			`progress.for-app`
		);
		const progressForIpfs = entry.querySelector(
			`progress.for-ipfs`
		);

		if ( ! (button instanceof HTMLButtonElement)) {
			throw new Error('Could not find button!');
		} else if (
			! (progressForApp instanceof HTMLProgressElement)
		) {
			throw new Error(
				'Could not find progress bar for app!'
			);
		} else if (
			! (progressForIpfs instanceof HTMLProgressElement)
		) {
			throw new Error(
				'Could not find progress bar for IPFS!'
			);
		}

		button.disabled = true;
		entry.classList.add('active');

		const cachedForApp = await filesByCacheStatus(
			filesForApp,
			true
		);
		const numberOfFilesInIpfs = Object.keys(
			filesInIpfs
		).length;
		const numberOfFilesInApp = Object.keys(
			filesForApp
		).length;

		if (numberOfFilesInIpfs < 1) {
			button.disabled = true;
			entry.classList.remove('active');

			await updateStorageEstimate();

			return;
		}

		let numberOfCachedForIpfs = await numberOfFilesInCache(
			filesInIpfs
		);
		let numberOfCachedForApp = await numberOfFilesInCache(
			filesForApp
		);

		const cache = await ocremixCache();
		const deleteFromCacheByPath = async (
			path: string
		): Promise<boolean> => {
			const cid = pathCID(path, filesForApp);

			return cache.delete(new Request('/ipfs/' + cid));
		};

		await Promise.all(Object.keys(cachedForApp).map((path: string) => {
			return deleteFromCacheByPath(path).then((maybe: boolean) => {
				--numberOfCachedForIpfs;
				--numberOfCachedForApp;

				progressForApp.value = (
					numberOfCachedForApp / numberOfFilesInApp
				);

				progressForIpfs.value = (
					numberOfCachedForIpfs / numberOfFilesInIpfs
				);

				return maybe;
			});
		}));

		numberOfCachedForIpfs = await numberOfFilesInCache(
			filesInIpfs
		);

		const cachedInIpfs = await filesByCacheStatus(
			filesInIpfs,
			true
		);

		await Promise.all(Object.keys(cachedInIpfs).map((path: string) => {
			return deleteFromCacheByPath(path).then((maybe: boolean) => {
				--numberOfCachedForIpfs;

				progressForIpfs.value = (
					numberOfCachedForIpfs / numberOfFilesInIpfs
				);

				return maybe;
			});
		}));

		button.disabled = true;
		entry.classList.remove('active');

		await updateStorageEstimate();
	};
}


export async function* yieldBulkAlbumAction(
	id: string,
	album: Album,
	filesInIpfs: CIDMap
): AsyncGenerator<string|TemplateResult> {
	yield `Loading ${id}`;

	const pathsForApp: Array<string> = [];
	const imageSourcesForAlbum =
		('art' in album)
			? (album as AlbumWithArt).art.covers
			: [];

	function pushImageSource(source: ImageSource): void {
		pathsForApp.push(source.subpath);

		source.srcset.forEach((srcset) => {
			pathsForApp.push(srcset.subpath);
		});
	}

	if ('art' in album) {
		imageSourcesForAlbum.push((album as AlbumWithArt).art.background);
	}

	Object.values(album.discs).forEach((disc) => {
		disc.art.forEach(pushImageSource);
		disc.tracks.forEach((track) => {
			pathsForApp.push(track.subpath);

			if ('background' in track) {
				pathsForApp.push((track.background as ImageSource).subpath);
			}
		});
	});

	imageSourcesForAlbum.forEach(pushImageSource);

	const filesForApp = Object.fromEntries(
		Object.entries(filesInIpfs).filter((entry) => {
			return pathsForApp.includes(entry[0]);
		})
	);

	yield html`
		${asyncReplace(
			yieldFilesProgress(
				id,
				filesForApp,
				'for-app',
				'Files cached for use in app'
			)
		)}
		${asyncReplace(
			yieldFilesProgress(
				id,
				filesInIpfs,
				'for-ipfs',
				'Files cached from IPFS source'
			)
		)}
		${asyncReplace((
			async function* (): AsyncGenerator<string|TemplateResult> {
				if ('art' in album) {
					yield html`<ocremix-image
						.cidMap=${filesForApp}
						.source=${(album as AlbumWithArt).art.covers[0]}
						></ocremix-image>`;
				} else {
					yield album.catalogNumber;
				}

				await updateStorageEstimate();

				await manuallyUpdateProgress(
					id,
					filesForApp,
					'for-app',
					'Files cached for use in app'
				);

				await manuallyUpdateProgress(
					id,
					filesInIpfs,
					'for-ipfs',
					'Files cached from IPFS source'
				);
			}
		)())}
		<div>
			<button
				aria-label="Clear all cached files for ${album.name}"
				data-action="remove"
				type="button"
				disabled
				@click=${RemoveAllFactory(
					filesForApp,
					filesInIpfs,
					id
				)}
			>🗑</button>
			<button
				aria-label="Get all needed files for ${album.name}"
				data-action="get-all"
				type="button"
				disabled
				@click=${GetAllFactory(filesForApp, filesInIpfs, id)}
			>🔽</button>
		</div>
	`;
}

export async function updateBulkAlbumActions(
	bulkAlbumActions: HTMLElement
): Promise<void> {
	render(
		html`${Object.entries(Albums).map((albumEntry) => {
			return html`${asyncReplace(
				(async function* (): AsyncGenerator<TemplateResult> {
					yield html`<li
						tabindex="0"
						class="entry"
						data-album="${albumEntry[0]}"
						data-name="Loading..."
					>Loading...</li>`;

					const { album, cids } = await albumEntry[1]();

					yield html`<li
						tabindex="0"
						class="entry"
						data-album="${albumEntry[0]}"
						data-name="${album.name}"
					>${asyncReplace(yieldBulkAlbumAction(
						albumEntry[0],
						album,
						cids
					))}</li>`;
				})()
			)}`;
		})}`,
		bulkAlbumActions
	);
}
