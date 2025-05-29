export type HouseholdRole = 'adult' | 'child' | 'unresolved';

export type CanonicalEmail = {
  value: string;
  type: 'personal' | 'work' | 'school' | 'other';
  is_valid: boolean;
};

export type CanonicalPhone = {
  value: string;
  type: 'mobile' | 'home' | 'work' | 'other';
};

export type CanonicalAddress = {
  line_1: string;
  line_2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  type: 'home' | 'work' | 'school' | 'other';
};

export type CanonicalAffiliation = {
  school_name: string;
  class_year?: number;
  relationship_type: string;
};

export type ConsentFlags = {
  email?: boolean;
  phone?: boolean;
  mail?: boolean;
  data_processing?: boolean;
};

export type CanonicalConstituent = {
  constituent_id: string;
  source_system: string;
  source_record_id: string;
  household_id?: string;
  household_role: HouseholdRole;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  prefix?: string;
  suffix?: string;
  emails: CanonicalEmail[];
  phones: CanonicalPhone[];
  addresses: CanonicalAddress[];
  affiliations: CanonicalAffiliation[];
  consent_flags: ConsentFlags;
  record_confidence: number;
};

export type CanonicalGift = {
  gift_id: string;
  source_system: string;
  source_record_id: string;
  constituent_id: string;
  amount_minor_units: number;
  currency: string;
  designation?: string;
  campaign?: string;
  appeal?: string;
  soft_credit_constituent_id?: string;
  posted_date: string;
};

const PLACEHOLDER_EMAILS = new Set([
  'n/a',
  'na',
  'none',
  'unknown',
  'noemail',
  'no-email',
  'test@test.com',
  'example@example.com',
]);

const PLACEHOLDER_EMAIL_DOMAINS = new Set(['example.com', 'invalid', 'localhost']);

export function isCanonicalEmail(value: unknown): value is CanonicalEmail {
  if (!isRecord(value)) return false;
  return (
    typeof value.value === 'string' &&
    isEmailType(value.type) &&
    typeof value.is_valid === 'boolean'
  );
}

export function isCanonicalConstituent(value: unknown): value is CanonicalConstituent {
  if (!isRecord(value)) return false;

  return (
    typeof value.constituent_id === 'string' &&
    typeof value.source_system === 'string' &&
    typeof value.source_record_id === 'string' &&
    isHouseholdRole(value.household_role) &&
    Array.isArray(value.emails) &&
    value.emails.every(isCanonicalEmail) &&
    Array.isArray(value.phones) &&
    value.phones.every(isCanonicalPhone) &&
    Array.isArray(value.addresses) &&
    value.addresses.every(isCanonicalAddress) &&
    Array.isArray(value.affiliations) &&
    value.affiliations.every(isCanonicalAffiliation) &&
    isRecord(value.consent_flags) &&
    typeof value.record_confidence === 'number' &&
    Number.isFinite(value.record_confidence)
  );
}

export function isCanonicalGift(value: unknown): value is CanonicalGift {
  if (!isRecord(value)) return false;

  return (
    typeof value.gift_id === 'string' &&
    typeof value.source_system === 'string' &&
    typeof value.source_record_id === 'string' &&
    typeof value.constituent_id === 'string' &&
    Number.isInteger(value.amount_minor_units) &&
    typeof value.currency === 'string' &&
    typeof value.posted_date === 'string'
  );
}

export function normalizeCanonicalConstituent(constituent: CanonicalConstituent): CanonicalConstituent {
  const emails = constituent.emails
    .map((email) => {
      const value = email.value.trim().toLowerCase();
      return {
        ...email,
        value,
        is_valid: email.is_valid && isUsableEmail(value),
      };
    })
    .filter((email) => isUsableEmail(email.value));

  return {
    ...constituent,
    constituent_id: constituent.constituent_id.trim(),
    source_system: constituent.source_system.trim(),
    source_record_id: constituent.source_record_id.trim(),
    household_id: trimOptional(constituent.household_id),
    first_name: trimOptional(constituent.first_name),
    middle_name: trimOptional(constituent.middle_name),
    last_name: trimOptional(constituent.last_name),
    prefix: trimOptional(constituent.prefix),
    suffix: trimOptional(constituent.suffix),
    emails,
    phones: constituent.phones.map((phone) => ({ ...phone, value: phone.value.trim() })),
  };
}

export function isUsableEmail(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || PLACEHOLDER_EMAILS.has(normalized)) return false;

  const match = normalized.match(/^[^@\s]+@([^@\s]+\.[^@\s]+)$/);
  if (!match) return false;

  return !PLACEHOLDER_EMAIL_DOMAINS.has(match[1] ?? '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHouseholdRole(value: unknown): value is HouseholdRole {
  return value === 'adult' || value === 'child' || value === 'unresolved';
}

function isEmailType(value: unknown): value is CanonicalEmail['type'] {
  return value === 'personal' || value === 'work' || value === 'school' || value === 'other';
}

function isCanonicalPhone(value: unknown): value is CanonicalPhone {
  return (
    isRecord(value) &&
    typeof value.value === 'string' &&
    (value.type === 'mobile' || value.type === 'home' || value.type === 'work' || value.type === 'other')
  );
}

function isCanonicalAddress(value: unknown): value is CanonicalAddress {
  return (
    isRecord(value) &&
    typeof value.line_1 === 'string' &&
    (value.type === 'home' || value.type === 'work' || value.type === 'school' || value.type === 'other')
  );
}

function isCanonicalAffiliation(value: unknown): value is CanonicalAffiliation {
  return (
    isRecord(value) &&
    typeof value.school_name === 'string' &&
    typeof value.relationship_type === 'string' &&
    (value.class_year === undefined || typeof value.class_year === 'number')
  );
}

function trimOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
