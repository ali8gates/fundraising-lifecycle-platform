export type PrismaStage = 'NEW' | 'QUALIFIED' | 'MEETING_SCHEDULED' | 'IN_DISCUSSION' | 'MEMBER' | 'ARCHIVED';

export type LifecycleStage = 'identify' | 'qualify' | 'cultivate' | 'solicit' | 'steward';

export const LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  'identify',
  'qualify',
  'cultivate',
  'solicit',
  'steward',
];

export type LifecycleStageMetadata = {
  enters: string;
  exits: string;
  owning_team: string;
};

export const LIFECYCLE_STAGE_METADATA: Record<LifecycleStage, LifecycleStageMetadata> = {
  identify: {
    enters: 'A prospect has been found and needs deduplication or initial review.',
    exits: 'The prospect meets written qualification criteria.',
    owning_team: 'prospect research',
  },
  qualify: {
    enters: 'A prospect is ready for scoring and written qualification review.',
    exits: 'A relationship owner schedules a meeting or begins active relationship work.',
    owning_team: 'prospect research',
  },
  cultivate: {
    enters: 'A meeting, contact discovery task, or relationship mapping task is active.',
    exits: 'The relationship is ready for a documented ask.',
    owning_team: 'relationship management',
  },
  solicit: {
    enters: 'An ask or active giving discussion is documented.',
    exits: 'The relationship becomes a member or moves to stewardship after the decision.',
    owning_team: 'fundraising',
  },
  steward: {
    enters: 'The relationship needs renewal, lapse, recognition, or ongoing stewardship work.',
    exits: 'The record remains in stewardship or is reintroduced through qualification.',
    owning_team: 'stewardship',
  },
};

export const LIFECYCLE_TO_PRISMA_STAGE: Record<LifecycleStage, readonly PrismaStage[]> = {
  identify: ['NEW'],
  qualify: ['QUALIFIED'],
  cultivate: ['MEETING_SCHEDULED'],
  solicit: ['IN_DISCUSSION'],
  steward: ['MEMBER', 'ARCHIVED'],
};

export const PRISMA_TO_LIFECYCLE_STAGE: Record<PrismaStage, LifecycleStage> = {
  NEW: 'identify',
  QUALIFIED: 'qualify',
  MEETING_SCHEDULED: 'cultivate',
  IN_DISCUSSION: 'solicit',
  MEMBER: 'steward',
  ARCHIVED: 'steward',
};

const ALLOWED_NEXT_STAGES: Record<LifecycleStage, readonly LifecycleStage[]> = {
  identify: ['identify', 'qualify'],
  qualify: ['qualify', 'cultivate'],
  cultivate: ['cultivate', 'solicit'],
  solicit: ['solicit', 'steward'],
  steward: ['steward', 'qualify'],
};

export function isLifecycleTransitionAllowed(from: LifecycleStage, to: LifecycleStage): boolean {
  return ALLOWED_NEXT_STAGES[from].includes(to);
}

export type LifecycleRecord = {
  stage: LifecycleStage;
};

export type LifecycleConversionCount = {
  stage: LifecycleStage;
  count: number;
  entered_from_previous_stage: number;
  conversion_rate_from_previous_stage: number | null;
};

export function computeStageConversionCounts(records: readonly LifecycleRecord[]): LifecycleConversionCount[] {
  const counts = new Map<LifecycleStage, number>();

  for (const stage of LIFECYCLE_STAGES) {
    counts.set(stage, 0);
  }

  for (const record of records) {
    counts.set(record.stage, (counts.get(record.stage) ?? 0) + 1);
  }

  return LIFECYCLE_STAGES.map((stage, index) => {
    const count = counts.get(stage) ?? 0;
    const previousStage = index === 0 ? undefined : LIFECYCLE_STAGES[index - 1];
    const previousCount = previousStage === undefined ? undefined : counts.get(previousStage);

    return {
      stage,
      count,
      entered_from_previous_stage: previousStage === undefined ? 0 : count,
      conversion_rate_from_previous_stage:
        previousCount === undefined || previousCount === 0 ? null : count / previousCount,
    };
  });
}
