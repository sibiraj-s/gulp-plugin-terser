const path = require('node:path');
const fs = require('node:fs/promises');
const Terser = require('terser');
const Vinyl = require('vinyl');

const TerserPlugin = require('../index.js');

const DEFAULT_ENCODING = 'utf8';

let executionPromise;
let done;
beforeEach(() => {
  executionPromise = new Promise((resolve) => {
    done = resolve;
  });
});

it('should return a buffer', async () => {
  const srcFilePath = path.resolve(__dirname, 'fixtures', 'math.js');
  const srcCode = await fs.readFile(srcFilePath, DEFAULT_ENCODING);

  const File = new Vinyl({
    contents: Buffer.from(srcCode),
  });

  const Minifier = TerserPlugin();
  Minifier.write(File);

  const result = await Terser.minify(srcCode);

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
