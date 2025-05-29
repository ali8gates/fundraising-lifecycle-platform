import { describe, it, expect } from 'vitest';
import { clamp01, normalize, weightedTotal } from '../src/scoring';

describe('scoring', () => {
  it('clamps to [0,1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it('normalizes', () => {
    expect(normalize(5, 0, 10)).toBe(0.5);
  });

  it('weighted total', () => {
    const total = weightedTotal(
      { ai_sophistication: 1, market_potential: 0, funding_stage: 0, team_expertise: 0, regulatory_positioning: 0 },
      { ai: 0.3, market: 0.25, funding: 0.2, team: 0.15, regulatory: 0.1 }
    );
    expect(total).toBeCloseTo(0.3);
  });
});

