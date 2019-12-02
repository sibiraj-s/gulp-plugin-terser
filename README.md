# gulp-plugin-terser [![Tests](https://github.com/sibiraj-s/gulp-plugin-terser/workflows/Tests/badge.svg)](https://github.com/sibiraj-s/gulp-plugin-terser/actions)

> Gulp plugin to minify files with terser

## Getting Started

### Installation

Installation can be done via package managers such as [npm] or [yarn]

```bash
$ npm install -D gulp-plugin-terser
# or
$ yarn add --dev gulp-plugin-terser
```

### Usage

```js
// gulpfile.js

const gulp = require('gulp');
const terser = require('gulp-plugin-terser');
const sourcemap = require('gulp-sourcemaps');

function minify() {
  const options = {
    suffix: '.min.js',
    terserOptions: {
      output: {
        comments: true
      }
    }
  };

  gulp
    .src('dist/*.js')
    .pipe(sourcemap.init())
    .pipe(terser(options))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('dist/'));
}

gulp.series(minify);
```

The above gulp task will minify all the `.js` files in the dist directory and writes it into a new file with extension `.min.js` in the same directory.

#### Options

- suffix: `{string | boolean}` - defaults to `.min.js`.
- terserOptions: `{object}` - refer https://github.com/terser/terser#minify-options

[npm]: https://www.npmjs.com/
[yarn]: https://yarnpkg.com/
