import { checkCard, checkRow, coveredCount } from '../src/check';
import { Card, Row } from '../src/types';

// Deterministic test card:
// Row 0: 1, 15, 23, 42, 61  (cols 0,1,2,4,6)
// Row 1: 5, 19, 31, 55, 77  (cols 0,1,3,5,7)
// Row 2: 8, 22, 48, 66, 88  (cols 0,2,4,6,8)
const testCard: Card = [
  [1,  15, 23, null, 42,  null, 61,  null, null] as Row,
  [5,  19, null, 31, null, 55,  null, 77,  null] as Row,
  [8,  22, null, null, 48, null, 66,  null, 88] as Row,
];

describe('checkCard', () => {
  it('returns all false when no balls drawn', () => {
    const result = checkCard(testCard, []);
    expect(result).toEqual({ line: false, quine: false, bingo: false });
  });

  it('detects Ligne when one row is complete', () => {
    const result = checkCard(testCard, [1, 15, 23, 42, 61]);
    expect(result.line).toBe(true);
    expect(result.quine).toBe(false);
    expect(result.bingo).toBe(false);
  });

  it('detects Quine when two rows are complete', () => {
    const result = checkCard(testCard, [1, 15, 23, 42, 61, 5, 19, 31, 55, 77]);
    expect(result.line).toBe(true);
    expect(result.quine).toBe(true);
    expect(result.bingo).toBe(false);
  });

  it('detects Bingo when all three rows are complete', () => {
    const allNums = [1, 15, 23, 42, 61, 5, 19, 31, 55, 77, 8, 22, 48, 66, 88];
    const result = checkCard(testCard, allNums);
    expect(result.line).toBe(true);
    expect(result.quine).toBe(true);
    expect(result.bingo).toBe(true);
  });

  it('ignores extra balls not on card', () => {
    // Draw row 0 numbers + many irrelevant balls
    const balls = [1, 15, 23, 42, 61, 2, 3, 4, 6, 7, 9, 10, 11, 12, 13];
    const result = checkCard(testCard, balls);
    expect(result.line).toBe(true);
    expect(result.quine).toBe(false);
  });

  it('is not affected by order of drawn balls', () => {
    const shuffled = [61, 1, 42, 23, 15];
    const result = checkCard(testCard, shuffled);
    expect(result.line).toBe(true);
  });
});

describe('checkRow', () => {
  it('returns true when all row numbers drawn', () => {
    expect(checkRow(testCard[0], [1, 15, 23, 42, 61])).toBe(true);
  });

  it('returns false when one number missing', () => {
    expect(checkRow(testCard[0], [1, 15, 23, 42])).toBe(false);
  });
});

describe('coveredCount', () => {
  it('returns 0 with no balls', () => {
    expect(coveredCount(testCard, [])).toBe(0);
  });

  it('counts correctly', () => {
    expect(coveredCount(testCard, [1, 5, 8, 99, 90])).toBe(3); // 99,90 not on card
  });

  it('returns 15 when all card numbers drawn', () => {
    const allNums = [1, 15, 23, 42, 61, 5, 19, 31, 55, 77, 8, 22, 48, 66, 88];
    expect(coveredCount(testCard, allNums)).toBe(15);
  });
});
