const gulp = require('gulp');
const postcss = require('gulp-postcss');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const newer = require('gulp-newer');
const purgecss = require('gulp-purgecss');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;
const inline_source = require('gulp-inline-source');
const rollup = require('rollup');
const typescript = require('gulp-typescript');

const rollupPlugins = {
	commonjs: require('@rollup/plugin-commonjs'),
	nodeResolve: require('@rollup/plugin-node-resolve'),
	jsonResolve: require('@rollup/plugin-json'),
	typescript: require('@rollup/plugin-typescript'),
	minifyHtml: require('rollup-plugin-minify-html-literals').default,
};

const postcss_plugins = {
	nested: require('postcss-nested'),
	calc: require('postcss-nested'),
	font_family_system_ui: require('postcss-font-family-system-ui'),
	system_monospace: require('postcss-system-monospace'),
	cssnano: require('cssnano'),
	import: require('postcss-import'),
};

const postcss_config = () => {
	return postcss([
		postcss_plugins.import(),
		postcss_plugins.nested(),
		postcss_plugins.calc(),
		postcss_plugins.font_family_system_ui(),
		postcss_plugins.system_monospace(),
		postcss_plugins.cssnano({
			cssDeclarationSorter: 'concentric-css',
			discardUnused: true,
		}),
	]);
};

gulp.task('css--style', () => {
	return gulp.src(
		'./src/css/style.css'
	).pipe(
		newer('./dist/css/')
	).pipe(
		postcss_config()
	).pipe(gulp.dest(
		'./dist/css/'
	));
});

gulp.task('css--first-load', () => {
	return gulp.src(
		'./src/css/style.css'
	).pipe(
		newer('./tmp/css/')
	).pipe(
		postcss_config()
	).pipe(purgecss({
		content: [
			'./tmp/**/*.html'
		],
		rejected: false,
	})).pipe(
		rename('first-load.css')
	).pipe(gulp.dest(
		'./tmp/css/'
	));
});

gulp.task('html', () => {
	return gulp.src('./src/**/*.html').pipe(
		newer('./tmp/')
	).pipe(htmlmin({
		collapseBooleanAttributes: true,
		collapseInlineTagWhitespace: false,
		collapseWhitespace: true,
		decodeEntities: true,
		sortAttributes: true,
		maxLineLength: 79,
	})).pipe(gulp.dest(
		'./tmp/'
	));
});

gulp.task('eslint', () => {
	return gulp.src(
		'./src/**/*.ts'
	).pipe(
		eslint({
			configFile: './.eslint.js',
		})
	).pipe(
		eslint.format()
	).pipe(
		eslint.failAfterError()
	);
});

gulp.task('sync', () => {
	return gulp.src([
		'./tmp/{css/**/*.css,js/**/*.{d.ts,js,map}}',
		'./src/module.d.ts',
	]).pipe(
		changed(
			'./dist/',
			{
				hasChanged: changed.compareContents
			}
		)
	).pipe(gulp.dest(
		'./dist/'
	));
});

gulp.task('sync--html', () => {
	return gulp.src([
		'./tmp/*.html',
	]).pipe(
		newer('./dist/')
	).pipe(
		inline_source()
	).pipe(
		gulp.dest('./dist/')
	)
});

gulp.task('sync--data', () => {
	return gulp.src([
		'./node_modules/ocremix-ipfs-data/src/data/ocremix-cids.min.json',
	]).pipe(
		newer('./dist/data')
	).pipe(
		gulp.dest('./dist/data/')
	);
});

gulp.task('uglify', () => {
	return gulp.src(
		'./tmp/**/*.js'
	).pipe(
		newer('./dist/')
	).pipe(
		uglify({
			module: true,
		})
	).pipe(gulp.dest('./dist/'));
});

gulp.task('rollup', async () => {
	const bundle = await rollup.rollup({
		input: './src/js/load.ts',
		plugins: [
			rollupPlugins.nodeResolve(),
			rollupPlugins.jsonResolve(),
			rollupPlugins.typescript({
				tsconfig: './tsconfig.json',
				outDir: './tmp/js',
			}),
			rollupPlugins.minifyHtml(),
		],
	});

	return await bundle.write({
		sourcemap: false,
		format: 'es',
		dir: './tmp/js/',
	});
});

gulp.task('sync--ipfs--build-module', async () => {
	const bundle = await rollup.rollup({
		input: './node_modules/ipfs/dist/index.js',
		plugins: [
			rollupPlugins.commonjs(),
		],
	});

	await bundle.write({
		sourcemap: true,
		format: 'es',
		dir: './src/ipfs/',
	});

	return await bundle.write({
		sourcemap: false,
		format: 'es',
		dir: './dist/ipfs/',
	});
});

gulp.task('sync--ocremix-data', () => {
	return gulp.src('./node_modules/ocremix-data/src/**/*.ts').pipe(
		typescript.createProject(
			'./tsconfig.ocremix-data.json'
		)()
	).pipe(
		gulp.dest('./src/ocremix-data/')
	);
});

gulp.task('default', gulp.series(...[
	'eslint',
	gulp.parallel(...[
		'html',
		'css--first-load',
		'css--style',
		'sync--ipfs--build-module',
		'sync--ocremix-data',
	]),
	'rollup',
	'uglify',
	'sync--html',
]));
