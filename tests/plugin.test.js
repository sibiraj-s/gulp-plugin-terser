const path = require('path');
const fs = require('fs');

const Terser = require('terser');
const Vinyl = require('vinyl');

const TerserPlugin = require('..');

const DEFAULT_ENCODING = 'utf8';

it('should return a buffer', async (done) => {
  const srcFilePath = path.resolve(__dirname, 'fixtures', 'math.js');
  const srcCode = await fs.promises.readFile(srcFilePath, DEFAULT_ENCODING);

  const File = new Vinyl({
    contents: Buffer.from(srcCode),
  });

  const Minifier = TerserPlugin();
  Minifier.write(File);

  Minifier.once('data', (file) => {
    expect(file.isBuffer()).toBe(true);
    expect(file.isStream()).toBe(false);

    const result = Terser.minify(srcCode);
    expect(result.error).toBeFalsy();
    expect(result.code).toBe(file.contents.toString());
    done();
  });
});

it('should do nothing when file content is null', async (done) => {
  const File = new Vinyl({
    contents: null,
  });

  const Minifier = TerserPlugin();
  Minifier.write(File);
  Minifier.once('data', (file) => {
    expect(file.isNull()).toBe(true);
    done();
  });
});
