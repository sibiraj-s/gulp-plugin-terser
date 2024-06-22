import path from 'node:path';
import fs from 'node:fs/promises';
import gulp from 'gulp';
import { minify as _minify } from 'terser';
import { beforeEach, it, afterEach, expect } from 'vitest';

import terser from '../index.js';

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
  await fs.rm(tempOutputDir, { recursive: true, force: true });
};

beforeEach(cleanOutputDir);
afterEach(cleanOutputDir);

let executionPromise;
let done;
beforeEach(() => {
  executionPromise = new Promise((resolve) => {
    done = resolve;
  });
});

const minify = async (filePath, options = {}) => {
  const rawCode = await fs.readFile(filePath, DEFAULT_ENCODING);
  const result = await _minify(rawCode, options);
  return result;
};

const readFile = async (filePath) => {
  const file = await fs.readFile(filePath, DEFAULT_ENCODING);
  return file.trim();
};

const useFixedSourceMapCode = (code) => {
  // @fixme. gulp outputs sourceMappingUrl in same line,
  // where as terser outputs in a new line.
  return code.split(';').join(';\n');
};

it('should minify the file', async () => {
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

  await executionPromise;
});

it('should minify the file with sourcemaps', async () => {
  const t = await minify(srcFile);

  const onRecieveData = (file) => {
    expect(file.contents.toString()).toBe(t.code);
    expect(file.sourceMap).toBeObject();
    expect(file.path).toEndWith('.min.js');
  };

  gulp.src(srcFile, { sourcemaps: true })
    .pipe(terser())
    .once('data', onRecieveData)
    .on('end', done);

  await executionPromise;
});

it('should minify the file and create sourcemap and write them to the temp directory', async () => {
  const terserOptions = {
    sourceMap: {
      filename: fixtures(targetMinFileName),
      url: targetMapFileName,
    },
  };

  const t = await minify(srcFile, terserOptions);
  expect(t.code).toBeTruthy();

  const onFinish = async () => {
    const code = await readFile(targetMinFile);
    const map = await readFile(targetMapFile);
    expect(t.code).toBe(useFixedSourceMapCode(code));
    expect(map).toBeTruthy();

    expect(JSON.parse(map).file).toBe(JSON.parse(t.map).file);
    done();
  };

  gulp.src(srcFile, { sourcemaps: true })
    .pipe(terser())
    .pipe(gulp.dest(tempOutputDir, { sourcemaps: '.' }))
    .on('end', onFinish);

  await executionPromise;
});

it('should create sourcemaps with built-in sourcemap support', async () => {
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
    expect(t.code).toBe(useFixedSourceMapCode(code));
    expect(map).toBeTruthy();
    expect(JSON.parse(map).file).toContain(JSON.parse(t.map).file);
    done();
  };

  gulp.src(srcFile, { sourcemaps: true })
    .pipe(terser())
    .pipe(gulp.dest(tempOutputDir, { sourcemaps: '.' }))
    .on('end', onFinish);

  await executionPromise;
});

it('should minify the file and should not create sourcemap by enabling it in terserOptions', async () => {
  const options = {
    terserOptions: {
      sourceMap: true,
    },
  };

  const t = await minify(srcFile, options.terserOptions);
  expect(t.code).toBeTruthy();

  const onRecieveData = (file) => {
    expect(file.sourceMap).toBeFalsy();
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .on('data', onRecieveData)
    .on('end', done);

  await executionPromise;
});

it('should minify the file with given options', async () => {
  const options = {
    terserOptions: {
      output: {
        comments: true,
      },
    },
  };

  const t = await minify(srcFile, options.terserOptions);
  expect(t.code).toBeTruthy();

  const onRecieveData = (file) => {
    expect(file.sourceMap).toBeFalsy();
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .on('data', onRecieveData)
    .on('end', done);

  await executionPromise;
});

it('should throw error when minification fails', async () => {
  gulp.src(fixtures('invalidjs'))
    .pipe(terser())
    .on('error', (err) => {
      expect(err).toBeTruthy();
      expect(err.name).toBe('SyntaxError');
      done();
    });

  await executionPromise;
});

it('should not support streams', async () => {
  gulp.src(srcFile, { buffer: false })
    .on('error', (err) => {
      expect(err.message).toBe('Streams are not supported!');
      expect(err.plugin).toBe('terser');
      done();
    })
    .pipe(terser());

  await executionPromise;
});

it('should emit file with default suffix', async () => {
  const options = {
    suffix: true,
  };

  gulp.src(srcFile)
    .pipe(terser(options))
    .once('data', (file) => {
      expect(file.path).toEndWith('.min.js');
    })
    .on('end', done);

  await executionPromise;
});

it('should emit file with original file suffix', async () => {
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

  await executionPromise;
});

it('should write file at the given destination when suffix is disabled', async () => {
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

  await executionPromise;
});

it('should emit file with given suffix', async () => {
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

  await executionPromise;
});
