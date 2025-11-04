export type ImageLabel = 'real' | 'ai';

export type ImageEntry = {
	src: string;
	label: ImageLabel;
};

const createEntries = (
	modules: Record<string, string>,
	label: ImageLabel
): ImageEntry[] =>
	Object.values(modules)
		.filter((src) => typeof src === 'string' && src.length > 0)
		.map((src) => ({ src, label }));

const REAL_IMAGE_MODULES = import.meta.glob<string>(
	'../assets/real/**/*.{png,jpg,jpeg,gif,webp,avif}',
	{ eager: true, import: 'default' }
);

const AI_IMAGE_MODULES = import.meta.glob<string>(
	'../assets/ai/**/*.{png,jpg,jpeg,gif,webp,avif}',
	{ eager: true, import: 'default' }
);

const sortBySrc = (a: ImageEntry, b: ImageEntry) =>
	a.src.localeCompare(b.src);

export const IMAGE_POOL: ImageEntry[] = [
	...createEntries(REAL_IMAGE_MODULES, 'real'),
	...createEntries(AI_IMAGE_MODULES, 'ai')
].sort(sortBySrc);

export const hasImages = IMAGE_POOL.length > 0;
