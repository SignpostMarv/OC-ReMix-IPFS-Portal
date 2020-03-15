import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';
import {
	asyncReplace,
} from 'lit-html/directives/async-replace';
import {
	ImageSource,
} from 'ocremix-data/src/module';
import { CIDMap } from '../../module';
import { urlForThing } from '../data';

async function* maybeYieldPictureFromSource(
	source: ImageSource,
	cids: CIDMap,
	placeholder = 'Loading...',
	className = ''
): AsyncGenerator<string|TemplateResult> {
	yield placeholder;

	const [
		src,
		srcset,
	] = await Promise.all([
		urlForThing(source, source.subpath, cids),
		Promise.all(source.srcset.map(async (srcset): Promise<string> => {
			return urlForThing(srcset, srcset.subpath, cids).then(
				(srcsetSrc): string => {
					return `${srcsetSrc} ${srcset.width.toString(10)}w`;
				}
			);
		})),
	]);

	const img = srcset.length > 0
		? html`<img
				src="${src}"
				width="${source.width}"
				height="${source.height}"
				srcset="${srcset.join(', ')}"
			>`
		: html`<img
				src="${src}"
				width="${source.width}"
				height="${source.height}"
			>`;

	yield '' === className
		? html`<picture>${img}</picture>`
		: html`<picture class="${className}">${img}</picture>`;
}

@customElement('ocremix-image')
export class ImageSourceElement extends LitElement
{
	@property()
	cidMap: CIDMap = {}

	@property()
	source: ImageSource = {width:0, height: 0, srcset: [], subpath: ''};

	@property()
	class = '';

	@property()
	placeholder = '';

	createRenderRoot(): ImageSourceElement
	{
		return this;
	}

	render(): TemplateResult
	{
		return html`${asyncReplace(maybeYieldPictureFromSource(
			this.source,
			this.cidMap,
			this.placeholder,
			this.class
		))}`;
	}
}
