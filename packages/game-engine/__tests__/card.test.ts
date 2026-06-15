import { generateCard, validateCard, cardNumbers } from '../src/card';

describe('generateCard', () => {
  it('generates a structurally valid card', () => {
    for (let i = 0; i < 100; i++) {
      const card = generateCard();
      const { valid, errors } = validateCard(card);
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
    }
  });

  it('has exactly 15 numbers', () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      expect(cardNumbers(card)).toHaveLength(15);
    }
  });

  it('has exactly 5 numbers per row', () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      for (const row of card) {
        const nums = row.filter((c) => c !== null);
        expect(nums).toHaveLength(5);
      }
    }
  });

  it('respects column ranges', () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      for (let col = 0; col < 9; col++) {
        const vals = card.map((r) => r[col]).filter((c): c is number => c !== null);
        for (const v of vals) {
          if (col === 0) expect(v).toBeGreaterThanOrEqual(1), expect(v).toBeLessThanOrEqual(9);
          else if (col === 8) expect(v).toBeGreaterThanOrEqual(80), expect(v).toBeLessThanOrEqual(90);
          else {
            expect(v).toBeGreaterThanOrEqual(col * 10);
            expect(v).toBeLessThanOrEqual(col * 10 + 9);
          }
        }
      }
    }
  });

  it('has no duplicate numbers on card', () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      const nums = cardNumbers(card);
      expect(new Set(nums).size).toBe(nums.length);
    }
  });

  it('each column has at least 1 number', () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      for (let col = 0; col < 9; col++) {
        const vals = card.map((r) => r[col]).filter((c) => c !== null);
        expect(vals.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
