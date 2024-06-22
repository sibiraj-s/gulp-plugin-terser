import { expect, it } from 'vitest';

import { add, subtract } from './fixtures/math';

it('should add two numbers', () => {
  expect(add(1, 3)).toBe(4);
});

it('should subtract two numbers', () => {
  expect(subtract(50, 3)).toBe(47);
});
