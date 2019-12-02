const Math = require('./fixtures/math');

it('should add two numbers', () => {
  expect(Math.add(1, 3)).toBe(4);
});

it('should subtract two numbers', () => {
  expect(Math.subtract(50, 3)).toBe(47);
});
