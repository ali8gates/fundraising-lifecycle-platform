import { describe, expect, it } from 'vitest';
import { reconcileSyncRun, type SyncRunMetrics } from '../src/crm/reconcile';

describe('sync reconciliation', () => {
  it('reports a silent inbound failure after a successful prior inbound run', () => {
    const previous: SyncRunMetrics = {
      entity_counts: [
        { direction: 'inbound', entity_type: 'constituent', expected_count: 12, observed_count: 12 },
      ],
      direction_statuses: [{ direction: 'inbound', status: 'success' }],
      ambiguous_household_rate: { inbound: 0.1 },
      mapping_error_count: { inbound: 0 },
    };
    const current: SyncRunMetrics = {
      entity_counts: [
        { direction: 'inbound', entity_type: 'constituent', expected_count: 12, observed_count: 0 },
      ],
      direction_statuses: [{ direction: 'inbound', status: 'success' }],
      ambiguous_household_rate: { inbound: 0.1 },
      mapping_error_count: { inbound: 0 },
    };

    const findings = reconcileSyncRun({ current, previous });

    expect(findings).toContainEqual({
      type: 'silent_failure',
      severity: 'critical',
      direction: 'inbound',
      sentence: 'Inbound reported success but observed zero records after the previous run observed 12.',
    });
  });

  it('reports count, ambiguity, mapping-error, and stalled-direction findings', () => {
    const findings = reconcileSyncRun({
      previous: {
        entity_counts: [
          { direction: 'outbound', entity_type: 'gift', expected_count: 8, observed_count: 8 },
        ],
        direction_statuses: [{ direction: 'outbound', status: 'success' }],
        ambiguous_household_rate: { outbound: 0.1 },
        mapping_error_count: { outbound: 2 },
      },
      current: {
        entity_counts: [
          { direction: 'outbound', entity_type: 'gift', expected_count: 8, observed_count: 6 },
        ],
        direction_statuses: [{ direction: 'outbound', status: 'running' }],
        ambiguous_household_rate: { outbound: 0.25 },
        mapping_error_count: { outbound: 7 },
      },
    });

    expect(findings.map((finding) => finding.type)).toEqual([
      'count_mismatch',
      'ambiguous_household_rate_drift',
      'mapping_error_spike',
      'stalled_direction',
    ]);
    expect(findings[0]?.sentence).toBe('outbound gift counts differ. Expected 8 and observed 6.');
  });
});
