import { describe, expect, it } from 'vitest';
import {
  computeStageConversionCounts,
  isLifecycleTransitionAllowed,
  LIFECYCLE_TO_PRISMA_STAGE,
  PRISMA_TO_LIFECYCLE_STAGE,
} from '../src/lifecycle';

describe('lifecycle', () => {
  it('maps the canonical stages to and from Prisma Stage values', () => {
    expect(LIFECYCLE_TO_PRISMA_STAGE.identify).toEqual(['NEW']);
    expect(LIFECYCLE_TO_PRISMA_STAGE.steward).toEqual(['MEMBER', 'ARCHIVED']);
    expect(PRISMA_TO_LIFECYCLE_STAGE.MEETING_SCHEDULED).toBe('cultivate');
    expect(PRISMA_TO_LIFECYCLE_STAGE.ARCHIVED).toBe('steward');
  });

  it('allows one-stage progress, a stewardship requalification, and no skipped stage', () => {
    expect(isLifecycleTransitionAllowed('identify', 'qualify')).toBe(true);
    expect(isLifecycleTransitionAllowed('steward', 'qualify')).toBe(true);
    expect(isLifecycleTransitionAllowed('identify', 'cultivate')).toBe(false);
    expect(isLifecycleTransitionAllowed('solicit', 'qualify')).toBe(false);
  });

  it('computes stage counts and conversion rates from a stage snapshot', () => {
    const conversionCounts = computeStageConversionCounts([
      { stage: 'identify' },
      { stage: 'identify' },
      { stage: 'qualify' },
      { stage: 'cultivate' },
      { stage: 'cultivate' },
      { stage: 'solicit' },
    ]);

    expect(conversionCounts).toEqual([
      {
        stage: 'identify',
        count: 2,
        entered_from_previous_stage: 0,
        conversion_rate_from_previous_stage: null,
      },
      {
        stage: 'qualify',
        count: 1,
        entered_from_previous_stage: 1,
        conversion_rate_from_previous_stage: 0.5,
      },
      {
        stage: 'cultivate',
        count: 2,
        entered_from_previous_stage: 2,
        conversion_rate_from_previous_stage: 2,
      },
      {
        stage: 'solicit',
        count: 1,
        entered_from_previous_stage: 1,
        conversion_rate_from_previous_stage: 0.5,
      },
      {
        stage: 'steward',
        count: 0,
        entered_from_previous_stage: 0,
        conversion_rate_from_previous_stage: 0,
      },
    ]);
  });
});
