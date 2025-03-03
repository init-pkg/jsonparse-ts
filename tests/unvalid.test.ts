import { describe, test, expect } from 'vitest';
import { Parser } from '../src'; // Убедись, что путь правильный

describe('Invalid JSON parsing', () => {
  test('should trigger onError exactly once', async () => {
    let count = 0;

    const p = new Parser();

    p.onError((err) => {
      count++;
      expect(count).toBe(1);
    });

    p.write('{"test": eer[');
  });
});
