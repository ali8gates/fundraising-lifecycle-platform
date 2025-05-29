import type { CanonicalAddress, CanonicalEmail, HouseholdRole } from './canonical';

export type HouseholdRoleResolutionRecord = {
  birth_date?: string;
  age?: number;
  relationship?: string;
  salutation?: string;
  title?: string;
  emails?: readonly Pick<CanonicalEmail, 'value'>[];
  school_email_domains?: readonly string[];
  class_year?: number;
  employer?: string;
  spouse?: string;
  addresses?: readonly CanonicalAddress[];
  known_adult_addresses?: readonly CanonicalAddress[];
  address_shared_with_known_adult?: boolean;
  name_matches_child_on_another_record?: boolean;
};

export type HouseholdRoleSignalName =
  | 'birth_date_or_age'
  | 'relationship'
  | 'salutation_or_title'
  | 'email_pattern'
  | 'class_year'
  | 'employer_or_spouse'
  | 'shared_adult_address'
  | 'child_name_match';

export type HouseholdRoleReason = {
  signal: HouseholdRoleSignalName;
  role: Exclude<HouseholdRole, 'unresolved'>;
  confidence: number;
  detail: string;
};

export type HouseholdRoleResolution = {
  role: HouseholdRole;
  confidence: number;
  reasons: HouseholdRoleReason[];
};

export type HouseholdRoleResolutionOptions = {
  confidence_floor?: number;
  /** Provide current_year when birth dates or class years are used. */
  current_year?: number;
};

export type ReviewQueueDecision = {
  action: 'write_through' | 'review_queue';
  reason: string;
};

export const DEFAULT_HOUSEHOLD_CONFIDENCE_FLOOR = 0.7;

export const HOUSEHOLD_ROLE_SIGNAL_ORDER: readonly HouseholdRoleSignalName[] = [
  'birth_date_or_age',
  'relationship',
  'salutation_or_title',
  'email_pattern',
  'class_year',
  'employer_or_spouse',
  'shared_adult_address',
  'child_name_match',
];

const ROLE_MARGIN = 0.15;

export function resolveHouseholdRole(
  record: HouseholdRoleResolutionRecord,
  options: HouseholdRoleResolutionOptions = {}
): HouseholdRoleResolution {
  const reasons = [
    ...findAgeSignals(record, options.current_year),
    ...findRelationshipSignals(record),
    ...findTitleSignals(record),
    ...findEmailSignals(record),
    ...findClassYearSignals(record, options.current_year),
    ...findEmployerOrSpouseSignals(record),
    ...findSharedAddressSignals(record),
    ...findChildNameSignals(record),
  ];
  const adultConfidence = combinedConfidence(reasons, 'adult');
  const childConfidence = combinedConfidence(reasons, 'child');
  const confidence = Math.max(adultConfidence, childConfidence);
  const floor = options.confidence_floor ?? DEFAULT_HOUSEHOLD_CONFIDENCE_FLOOR;

  if (confidence < floor || Math.abs(adultConfidence - childConfidence) < ROLE_MARGIN) {
    return { role: 'unresolved', confidence, reasons };
  }

  return {
    role: adultConfidence > childConfidence ? 'adult' : 'child',
    confidence,
    reasons,
  };
}

export function getReviewQueueDecision(
  resolution: HouseholdRoleResolution,
  confidenceFloor = DEFAULT_HOUSEHOLD_CONFIDENCE_FLOOR
): ReviewQueueDecision {
  if (resolution.role === 'unresolved' || resolution.confidence < confidenceFloor) {
    return {
      action: 'review_queue',
      reason: 'The household role is unresolved or below the confidence floor.',
    };
  }

  return {
    action: 'write_through',
    reason: 'The household role is resolved at or above the confidence floor.',
  };
}

function findAgeSignals(record: HouseholdRoleResolutionRecord, currentYear: number | undefined): HouseholdRoleReason[] {
  if (typeof record.age === 'number' && Number.isFinite(record.age)) {
    if (record.age < 18) return [reason('birth_date_or_age', 'child', 0.95, 'The explicit age indicates a child.')];
    return [reason('birth_date_or_age', 'adult', 0.95, 'The explicit age indicates an adult.')];
  }

  if (!record.birth_date) return [];
  if (currentYear === undefined) return [];
  const birthYear = Number(record.birth_date.slice(0, 4));
  if (!Number.isInteger(birthYear) || birthYear < 1900) return [];
  const age = currentYear - birthYear;
  if (age < 18) return [reason('birth_date_or_age', 'child', 0.95, 'The birth date indicates a child.')];
  return [reason('birth_date_or_age', 'adult', 0.95, 'The birth date indicates an adult.')];
}

function findRelationshipSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  const relationship = record.relationship?.trim().toLowerCase();
  if (!relationship) return [];
  if (/(parent|guardian|mother|father|spouse|alumni|adult)/.test(relationship)) {
    return [reason('relationship', 'adult', 0.9, 'The relationship field indicates an adult household role.')];
  }
  if (/(child|student|son|daughter|dependent|minor)/.test(relationship)) {
    return [reason('relationship', 'child', 0.9, 'The relationship field indicates a child household role.')];
  }
  return [];
}

function findTitleSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  const text = `${record.salutation ?? ''} ${record.title ?? ''}`.trim().toLowerCase();
  if (!text) return [];
  if (/(mr\.?|mrs\.?|ms\.?|miss|dr\.?|prof\.?|parent|guardian)/.test(text)) {
    return [reason('salutation_or_title', 'adult', 0.72, 'The salutation or title indicates an adult household role.')];
  }
  return [];
}

function findEmailSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  const emails = record.emails ?? [];
  const schoolDomains = new Set((record.school_email_domains ?? []).map((domain) => domain.toLowerCase()));
  const reasons: HouseholdRoleReason[] = [];

  for (const email of emails) {
    const value = email.value.trim().toLowerCase();
    const [localPart, domain] = value.split('@');
    if (!localPart || !domain) continue;

    if (/(parent[-_.]?of|mom[-_.]?of|dad[-_.]?of|guardian[-_.]?of)/.test(localPart)) {
      reasons.push(reason('email_pattern', 'adult', 0.72, 'The email local part indicates a parent or guardian.'));
    }
    if (schoolDomains.has(domain) || /(student|pupil|grad\d{2,4}|classof\d{2,4})/.test(localPart)) {
      reasons.push(reason('email_pattern', 'child', 0.65, 'The email pattern indicates a school or student account.'));
    }
  }

  return reasons;
}

function findClassYearSignals(record: HouseholdRoleResolutionRecord, currentYear: number | undefined): HouseholdRoleReason[] {
  if (!Number.isInteger(record.class_year) || currentYear === undefined) return [];
  const classYear = record.class_year as number;
  if (classYear >= currentYear - 1 && classYear <= currentYear + 6) {
    return [reason('class_year', 'child', 0.65, 'The class year is consistent with a current student.')];
  }
  if (classYear <= currentYear - 10) {
    return [reason('class_year', 'adult', 0.55, 'The class year is consistent with an adult alumnus.')];
  }
  return [];
}

function findEmployerOrSpouseSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  const reasons: HouseholdRoleReason[] = [];
  if (hasText(record.employer)) {
    reasons.push(reason('employer_or_spouse', 'adult', 0.75, 'The employer field indicates an adult household role.'));
  }
  if (hasText(record.spouse)) {
    reasons.push(reason('employer_or_spouse', 'adult', 0.75, 'The spouse field indicates an adult household role.'));
  }
  return reasons;
}

function findSharedAddressSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  if (record.address_shared_with_known_adult || hasSharedAddress(record.addresses, record.known_adult_addresses)) {
    return [reason('shared_adult_address', 'child', 0.82, 'The address is shared with a known adult record.')];
  }
  return [];
}

function findChildNameSignals(record: HouseholdRoleResolutionRecord): HouseholdRoleReason[] {
  if (record.name_matches_child_on_another_record) {
    return [reason('child_name_match', 'child', 0.88, 'The name matches a child field on another record.')];
  }
  return [];
}

function combinedConfidence(reasons: readonly HouseholdRoleReason[], role: Exclude<HouseholdRole, 'unresolved'>): number {
  return 1 - reasons
    .filter((reason) => reason.role === role)
    .reduce((remaining, reason) => remaining * (1 - reason.confidence), 1);
}

function reason(
  signal: HouseholdRoleSignalName,
  role: Exclude<HouseholdRole, 'unresolved'>,
  confidence: number,
  detail: string
): HouseholdRoleReason {
  return { signal, role, confidence, detail };
}

function hasText(value: string | undefined): boolean {
  return value?.trim().length !== 0 && value !== undefined;
}

function hasSharedAddress(
  addresses: readonly CanonicalAddress[] | undefined,
  knownAdultAddresses: readonly CanonicalAddress[] | undefined
): boolean {
  if (!addresses || !knownAdultAddresses) return false;
  const knownKeys = new Set(knownAdultAddresses.map(addressKey));
  return addresses.some((address) => knownKeys.has(addressKey(address)));
}

function addressKey(address: CanonicalAddress): string {
  return [address.line_1, address.city, address.region, address.postal_code]
    .map((part) => part?.trim().toLowerCase() ?? '')
    .join('|');
}
