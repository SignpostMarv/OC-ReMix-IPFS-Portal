import {
	html,
	render,
} from 'lit-html';
import {
	updateStorageEstimate,
	storageEstimate,
	updateBulkAlbumActions,
	appInfo,
} from './app-info/bulk-album-actions.js';
import {
	updateTitleSuffix,
} from '../utilities/elements.js';

const bulkAlbumActions = document.createElement('ol');
let rendered = false;

bulkAlbumActions.classList.add('albums');

export async function updateAppInfo(): Promise<HTMLElement> {
	updateTitleSuffix('App Info');

	const cloudflare = !! localStorage.getItem('enable-cloudflare-gateway');
	const cloudflareDirectly = !! localStorage.getItem(
		'directly-enable-cloudflare-gateway'
	);

	if ( ! rendered) {
		render(
			html`
				<h2>App Info</h2>
				<p>
					Use <a
						href="https://www.cloudflare.com/distributed-web-gateway/"
						target="_blank"
						rel="nofollow noopener"
					>Cloudflare Gateway</a>:
					<button
						type="button"
						role="switch"
						aria-checked="${cloudflare ? 'true' : 'false'}"
						title="Toggle usage of Cloudflare Gateway"
						@click=${(e: Event): void => {
							const button = e.target as HTMLButtonElement;

							const status = ! localStorage.getItem(
								'enable-cloudflare-gateway'
							);

							if (status) {
								localStorage.setItem(
									'enable-cloudflare-gateway',
									'1'
								);
							} else {
								localStorage.removeItem(
									'enable-cloudflare-gateway'
								);
							}

							button.setAttribute(
								'aria-checked',
								status ? 'true' : 'false'
							);

							button.textContent = (
								status ? '☑' : '☐'
							);
						}}
					>${cloudflare ? '☑' : '☐'}</button>
				</p>
				<p>
					Use <a
						href="https://www.cloudflare.com/distributed-web-gateway/"
						target="_blank"
						rel="nofollow noopener"
					>Cloudflare Gateway</a> directly (skips ipfs/local caching):
					<button
						type="button"
						role="switch"
						aria-checked="${cloudflare ? 'true' : 'false'}"
						title="Toggle usage of Cloudflare Gateway"
						@click=${(e: Event): void => {
							const button = e.target as HTMLButtonElement;

							const status = ! localStorage.getItem(
								'directly-enable-cloudflare-gateway'
							);

							if (status) {
								localStorage.setItem(
									'directly-enable-cloudflare-gateway',
									'1'
								);
							} else {
								localStorage.removeItem(
									'directly-enable-cloudflare-gateway'
								);
							}

							button.setAttribute(
								'aria-checked',
								status ? 'true' : 'false'
							);

							button.textContent = (
								status ? '☑' : '☐'
							);
						}}
					>${cloudflareDirectly ? '☑' : '☐'}</button>
				</p>
				${
					('storage' in navigator)
						? html`
							<h3>Data</h3>
							<h3>Storage Estimate</h4>
							${storageEstimate}
							<h3>Albums</h3>
							${bulkAlbumActions}
						`
						: html`<p>No App Info</p>`
				}
			`,
			appInfo
		);

		rendered = true;
	}

	await Promise.all([
		updateStorageEstimate(),
		updateBulkAlbumActions(bulkAlbumActions),
	]);

	return appInfo;
}
