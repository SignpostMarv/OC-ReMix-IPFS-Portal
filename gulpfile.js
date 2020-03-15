const gulp = require('gulp');
const postcss = require('gulp-postcss');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const newer = require('gulp-newer');
const purgecss = require('gulp-purgecss');
const typescript = require('gulp-typescript');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const filter = require('gulp-filter');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify-es').default;
const inline_source = require('gulp-inline-source');
const rollup = require('rollup');
const rollupCommonJs = require('@rollup/plugin-commonjs');
const rollupNodeResolve = require('@rollup/plugin-node-resolve');
const rollupJsonResolve = require('@rollup/plugin-json');
const merge = require('merge-stream');

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

const makeTypescript = (
	glob,
	newerDest,
	filterOptions = ['**', '!**/*.d.ts'],
	projectFile = './tsconfig.json'
) => {
	return gulp.src(
		glob
	).pipe(
		filter(filterOptions)
	).pipe(
		sourcemaps.init()
	).pipe(
		eslint({
			configFile: './.eslint.js',
		})
	).pipe(
		eslint.format()
	).pipe(
		eslint.failAfterError()
	).pipe(newer({
		dest: newerDest,
		ext: '.js',
	})).pipe(
		typescript.createProject(projectFile)()
	);
};

gulp.task('ts', () => {
	const ts = makeTypescript(
		'./src/js/**/*.ts',
		'./src/js/',
		[
			'**',
			'!**/*.worker.ts',
			'!**/*.d.ts',
		]
	);

	const workers = makeTypescript(
		'./src/js/**/*.worker.ts',
		'./src/js/',
		[],
		'./tsconfig.workers.json'
	);

	return merge(...[
		ts.js.pipe(uglify()),
		workers.pipe(uglify()),
		ts.dts,
		workers.dts,
	]).pipe(
		sourcemaps.write('./')
	).pipe(gulp.dest(
		'./src/js/'
	));
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
		input: './src/js/load.js',
		plugins: [
			rollupNodeResolve(),
			rollupJsonResolve(),
		],
	});

	return await bundle.write({
		sourcemap: true,
		format: 'es',
		dir: './tmp/js/',
	});
});

gulp.task('sync--ipfs--build-module', async () => {
	const bundle = await rollup.rollup({
		input: './node_modules/ipfs/dist/index.js',
		plugins: [
			rollupCommonJs(),
		],
	});

	return await bundle.write({
		sourcemap: true,
		format: 'es',
		dir: './src/ipfs/',
	});
});

gulp.task('default', gulp.series(...[
	gulp.parallel(...[
		'html',
		'css--first-load',
		'css--style',
		'ts',
		'sync--ipfs--build-module',
	]),
	'rollup',
	'uglify',
	'sync--html',
]));
