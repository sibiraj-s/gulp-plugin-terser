const Math = require('./fixtures/math');

it('should add two numbers', () => new Promise((done) => {
  expect(Math.add(1, 3)).toBe(4);
  done();
}));

it('should subtract two numbers', () => new Promise((done) => {
  expect(Math.subtract(50, 3)).toBe(47);
  done();
}));
