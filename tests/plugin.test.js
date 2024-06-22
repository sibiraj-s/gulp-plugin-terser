import { resolve as _resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

import { beforeEach, expect, it } from 'vitest';
import { minify } from 'terser';
import Vinyl from 'vinyl';

import TerserPlugin from '../index.js';

const DEFAULT_ENCODING = 'utf8';

let executionPromise;
let done;
beforeEach(() => {
  executionPromise = new Promise((resolve) => {
    done = resolve;
  });
});

it('should return a buffer', async () => {
  const srcFilePath = _resolve(__dirname, 'fixtures', 'math.js');
  const srcCode = await readFile(srcFilePath, DEFAULT_ENCODING);

  const File = new Vinyl({
    contents: Buffer.from(srcCode),
  });

  const Minifier = TerserPlugin();
  Minifier.write(File);

  const result = await minify(srcCode);

  Minifier.once('data', (file) => {
    expect(file.isBuffer()).toBe(true);
    expect(file.isStream()).toBe(false);
    expect(result.code).toBe(file.contents.toString());
    done();
  });

  await executionPromise;
});

it('should do nothing when file content is null', async () => {
  const File = new Vinyl({
    contents: null,
  });

  const Minifier = TerserPlugin();
  Minifier.write(File);
  Minifier.once('data', (file) => {
    expect(file.isNull()).toBe(true);
    done();
  });

  await executionPromise;
});
