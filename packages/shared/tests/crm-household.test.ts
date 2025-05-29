import { describe, expect, it } from 'vitest';
import {
  getReviewQueueDecision,
  HOUSEHOLD_ROLE_SIGNAL_ORDER,
  resolveHouseholdRole,
} from '../src/crm/household';

describe('household role resolution', () => {
  it('uses explicit age before lower-confidence signals', () => {
    const resolution = resolveHouseholdRole({
      age: 42,
      emails: [{ value: 'student@school.test' }],
      school_email_domains: ['school.test'],
    });

    expect(HOUSEHOLD_ROLE_SIGNAL_ORDER[0]).toBe('birth_date_or_age');
    expect(resolution.role).toBe('adult');
    expect(resolution.confidence).toBe(0.95);
    expect(resolution.reasons[0]?.signal).toBe('birth_date_or_age');
  });

  it('resolves a child from independently testable school, class-year, and address signals', () => {
    const resolution = resolveHouseholdRole(
      {
        emails: [{ value: 'student@school.test' }],
        school_email_domains: ['school.test'],
        class_year: 2028,
        address_shared_with_known_adult: true,
      },
      { current_year: 2026 }
    );

    expect(resolution.role).toBe('child');
    expect(resolution.confidence).toBeGreaterThan(0.9);
    expect(resolution.reasons.map((reason) => reason.signal)).toEqual([
      'email_pattern',
      'class_year',
      'shared_adult_address',
    ]);
    expect(getReviewQueueDecision(resolution).action).toBe('write_through');
  });

  it('leaves a school and email-only record unresolved and routes it for review', () => {
    const resolution = resolveHouseholdRole({
      emails: [{ value: 'contact@example.net' }],
    });

    expect(resolution.role).toBe('unresolved');
    expect(resolution.confidence).toBe(0);
    expect(getReviewQueueDecision(resolution)).toEqual({
      action: 'review_queue',
      reason: 'The household role is unresolved or below the confidence floor.',
    });
  });

  it('respects a configured confidence floor', () => {
    const resolution = resolveHouseholdRole(
      { title: 'Dr.' },
      { confidence_floor: 0.8 }
    );

    expect(resolution.role).toBe('unresolved');
    expect(resolution.confidence).toBe(0.72);
  });
});
