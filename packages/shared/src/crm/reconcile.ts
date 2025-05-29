export type SyncDirection = 'inbound' | 'outbound';

export type SyncEntityCount = {
  direction: SyncDirection;
  entity_type: string;
  expected_count: number;
  observed_count: number;
};

export type SyncDirectionStatus = {
  direction: SyncDirection;
  status: 'success' | 'failed' | 'running' | 'not_run';
};

export type SyncRunMetrics = {
  entity_counts: readonly SyncEntityCount[];
  direction_statuses: readonly SyncDirectionStatus[];
  ambiguous_household_rate: Partial<Record<SyncDirection, number>>;
  mapping_error_count: Partial<Record<SyncDirection, number>>;
};

export type ReconciliationThresholds = {
  silent_failure_previous_record_minimum: number;
  ambiguous_household_rate_increase: number;
  mapping_error_minimum_increase: number;
  mapping_error_multiplier: number;
};

/** Illustrative defaults. Override these per environment after reviewing run history. */
export const DEFAULT_RECONCILIATION_THRESHOLDS: ReconciliationThresholds = {
  silent_failure_previous_record_minimum: 10,
  ambiguous_household_rate_increase: 0.1,
  mapping_error_minimum_increase: 5,
  mapping_error_multiplier: 2,
};

export type ReconciliationFinding = {
  type: 'count_mismatch' | 'silent_failure' | 'ambiguous_household_rate_drift' | 'mapping_error_spike' | 'stalled_direction';
  severity: 'warning' | 'critical';
  sentence: string;
  direction?: SyncDirection;
  entity_type?: string;
};

export type ReconciliationInput = {
  current: SyncRunMetrics;
  previous?: SyncRunMetrics;
  thresholds?: Partial<ReconciliationThresholds>;
};

export function reconcileSyncRun(input: ReconciliationInput): ReconciliationFinding[] {
  const thresholds = { ...DEFAULT_RECONCILIATION_THRESHOLDS, ...input.thresholds };
  const findings: ReconciliationFinding[] = [];

  for (const count of input.current.entity_counts) {
    if (count.expected_count === count.observed_count) continue;
    findings.push({
      type: 'count_mismatch',
      severity: count.expected_count > 0 && count.observed_count === 0 ? 'critical' : 'warning',
      direction: count.direction,
      entity_type: count.entity_type,
      sentence: `${count.direction} ${count.entity_type} counts differ. Expected ${count.expected_count} and observed ${count.observed_count}.`,
    });
  }

  findings.push(...findSilentInboundFailures(input.current, input.previous, thresholds));
  findings.push(...findAmbiguousHouseholdRateDrift(input.current, input.previous, thresholds));
  findings.push(...findMappingErrorSpikes(input.current, input.previous, thresholds));
  findings.push(...findStalledDirections(input.current));

  return findings;
}

function findSilentInboundFailures(
  current: SyncRunMetrics,
  previous: SyncRunMetrics | undefined,
  thresholds: ReconciliationThresholds
): ReconciliationFinding[] {
  if (!previous || statusFor(current, 'inbound') !== 'success') return [];

  const currentInboundCount = totalObservedCount(current, 'inbound');
  const previousInboundCount = totalObservedCount(previous, 'inbound');
  if (
    currentInboundCount !== 0 ||
    previousInboundCount < thresholds.silent_failure_previous_record_minimum
  ) {
    return [];
  }

  return [{
    type: 'silent_failure',
    severity: 'critical',
    direction: 'inbound',
    sentence: `Inbound reported success but observed zero records after the previous run observed ${previousInboundCount}.`,
  }];
}

function findAmbiguousHouseholdRateDrift(
  current: SyncRunMetrics,
  previous: SyncRunMetrics | undefined,
  thresholds: ReconciliationThresholds
): ReconciliationFinding[] {
  if (!previous) return [];
  const findings: ReconciliationFinding[] = [];

  for (const direction of ['inbound', 'outbound'] as const) {
    const currentRate = current.ambiguous_household_rate[direction];
    const previousRate = previous.ambiguous_household_rate[direction];
    if (currentRate === undefined || previousRate === undefined) continue;
    if (currentRate - previousRate < thresholds.ambiguous_household_rate_increase) continue;

    findings.push({
      type: 'ambiguous_household_rate_drift',
      severity: 'warning',
      direction,
      sentence: `The ${direction} ambiguous household rate increased from ${formatRate(previousRate)} to ${formatRate(currentRate)}.`,
    });
  }

  return findings;
}

function findMappingErrorSpikes(
  current: SyncRunMetrics,
  previous: SyncRunMetrics | undefined,
  thresholds: ReconciliationThresholds
): ReconciliationFinding[] {
  if (!previous) return [];
  const findings: ReconciliationFinding[] = [];

  for (const direction of ['inbound', 'outbound'] as const) {
    const currentErrors = current.mapping_error_count[direction] ?? 0;
    const previousErrors = previous.mapping_error_count[direction] ?? 0;
    const increasedEnough = currentErrors - previousErrors >= thresholds.mapping_error_minimum_increase;
    const multipliedEnough = currentErrors >= Math.max(1, previousErrors * thresholds.mapping_error_multiplier);
    if (!increasedEnough || !multipliedEnough) continue;

    findings.push({
      type: 'mapping_error_spike',
      severity: 'warning',
      direction,
      sentence: `${direction} mapping errors increased from ${previousErrors} to ${currentErrors}.`,
    });
  }

  return findings;
}

function findStalledDirections(current: SyncRunMetrics): ReconciliationFinding[] {
  return current.direction_statuses
    .filter((status) => status.status === 'running' || status.status === 'not_run')
    .map((status) => ({
      type: 'stalled_direction' as const,
      severity: 'warning' as const,
      direction: status.direction,
      sentence: `The ${status.direction} sync direction is ${status.status} and needs follow-up.`,
    }));
}

function totalObservedCount(run: SyncRunMetrics, direction: SyncDirection): number {
  return run.entity_counts
    .filter((count) => count.direction === direction)
    .reduce((total, count) => total + count.observed_count, 0);
}

function statusFor(run: SyncRunMetrics, direction: SyncDirection): SyncDirectionStatus['status'] | undefined {
  return run.direction_statuses.find((status) => status.direction === direction)?.status;
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}
