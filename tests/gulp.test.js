const path = require('path');
const fs = require('fs');

const gulp = require('gulp');
const Terser = require('terser');

const sourcemaps = require('gulp-sourcemaps');

const terser = require('..');

const tempOutputDir = path.resolve(__dirname, 'temp');
const DEFAULT_ENCODING = 'utf8';

const srcFileName = 'math.js';
const targetMinFileName = 'math.min.js';
const targetMapFileName = 'math.min.js.map';

const fixtures = (glob) => path.resolve(__dirname, 'fixtures', glob);
const srcFile = fixtures(srcFileName);
const targetMinFile = path.resolve(tempOutputDir, targetMinFileName);
const targetMapFile = path.resolve(tempOutputDir, targetMapFileName);

const cleanOutputDir = async () => {
  await fs.promises.rmdir(tempOutputDir, { recursive: true });
};

const JEST_TIMEOUT = 10 * 1000;
jest.setTimeout(JEST_TIMEOUT);

beforeEach(cleanOutputDir);
afterEach(cleanOutputDir);

const minify = async (filePath, options = {}) => {
  const rawCode = await fs.promises.readFile(filePath, DEFAULT_ENCODING);
  const result = Terser.minify(rawCode, options);
  return result;
};

const readFile = async (filePath) => {
  const file = await fs.promises.readFile(filePath, DEFAULT_ENCODING);
  return file.trim();
};

it('should minify the file', async (done) => {
  const t = await minify(srcFile);

  const onRecieveData = (file) => {
    expect(file.contents.toString()).toBe(t.code);
    expect(file.sourceMap).toBeUndefined();
    expect(file.path).toEndWith('.min.js');
  };

  gulp.src(srcFile)
    .pipe(terser())
    .once('data', onRecieveData)
    .on('end', done);
});

it('should minify the file with sourcemaps', async (done) => {
  const t = await minify(srcFile);

  const onRecieveData = (file) => {
    expect(file.contents.toString()).toBe(t.code);
    expect(file.sourceMap).toBeObject();
    expect(file.path).toEndWith('.min.js');
  };

  gulp.src(srcFile)
    .pipe(sourcemaps.init())
    .pipe(terser())
    .once('data', onRecieveData)
    .on('end', done);
});

it('should minify the file and create sourcemap and write them to the temp directory', async (done) => {
  const terserOptions = {
    sourceMap: {
      filename: targetMinFileName,
      url: targetMapFileName,
    },
  };

  const t = await minify(srcFile, terserOptions);
  expect(t.code).toBeTruthy();

  const onFinish = async () => {
    const code = await readFile(targetMinFile);
    const map = await readFile(targetMapFile);
    expect(t.code).toBe(code);
    expect(map).toBeTruthy();
    expect(JSON.parse(map).file).toBe(JSON.parse(t.map).file);
    done();
  };

  gulp.src(srcFile)
    .pipe(sourcemaps.init())
    .pipe(terser())
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(tempOutputDir))
    .on('end', onFinish);
});

it('should minify the file and should not create sourcemap by enabling it in terserOptions', async (done) => {
  const options = {
    terserOptions: {
      sourceMap: true,
    },
  };

  const t = await minify(srcFile, options.terserOptions);
  expect(t.code).toBeTruthy();

  const onRecieveData = async (file) => {
    expect(file.sourceMap).toBeFalsy();
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .on('data', onRecieveData)
    .on('end', done);
});

it('should minify the file with given options', async (done) => {
  const options = {
    terserOptions: {
      output: {
        comments: true,
      },
    },
  };

  const t = await minify(srcFile, options.terserOptions);
  expect(t.code).toBeTruthy();

  const onRecieveData = async (file) => {
    expect(file.sourceMap).toBeFalsy();
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .on('data', onRecieveData)
    .on('end', done);
});

it('should throw error when minification fails', async (done) => {
  gulp.src(fixtures('invalidjs'))
    .pipe(terser())
    .once('error', (err) => {
      expect(err).toBeTruthy();
      expect(err.name).toBe('SyntaxError');
      done();
    });
});

it('should not support streams', async (done) => {
  gulp.src(srcFile, { buffer: false })
    .pipe(terser())
    .once('error', (err) => {
      expect(err.message).toBe('Streams are not supported!');
      expect(err.plugin).toBe('terser');
      done();
    });
});

it('should emit file with default suffix', async (done) => {
  const options = {
    suffix: true,
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .once('data', (file) => {
      expect(file.path).toEndWith('.min.js');
    })
    .on('end', done);
});

it('should emit file with original file suffix', async (done) => {
  const options = {
    suffix: false,
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .once('data', (file) => {
      expect(file.path).toEndWith('.js');
      expect(file.path).toBe(srcFile);
    })
    .on('end', done);
});

it('should write file at the given destination when suffix is disabled', async (done) => {
  const options = {
    suffix: false,
  };

  const expectedOutFilePath = path.resolve(tempOutputDir, srcFileName);

  gulp.src(srcFile)
    .pipe(terser(options))
    .pipe(gulp.dest(tempOutputDir))
    .once('data', (file) => {
      expect(file.path).toBe(expectedOutFilePath);
    })
    .on('end', done);
});

it('should emit file with given suffix', async (done) => {
  const options = {
    suffix: '.minified.js',
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .once('data', (file) => {
      expect(file.path).toEndWith('.minified.js');
      expect(file.path).toEndWith('.js');
      expect(file.path).not.toEndWith('.jsx');
    })
    .on('end', done);
});
