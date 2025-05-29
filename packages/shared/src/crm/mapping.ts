import {
  isCanonicalConstituent,
  normalizeCanonicalConstituent,
  type CanonicalConstituent,
  type CanonicalEmail,
} from './canonical';

export type MappingTransform = 'trim' | 'lowercase' | 'split_name' | 'first_item';

export type MappingProfile = {
  system_id: string;
  environment_variant: string;
  version_label: string;
  field_paths: Record<string, string>;
  transforms: Record<string, readonly MappingTransform[]>;
  required_fields: readonly (keyof CanonicalConstituent)[];
  known_quirks: readonly string[];
};

export type MappingError = {
  code: 'invalid_record' | 'missing_required_field' | 'invalid_value';
  field: string;
  message: string;
};

export type ApplyProfileResult =
  | { ok: true; constituent: CanonicalConstituent }
  | { ok: false; errors: MappingError[] };

export const MAPPING_PROFILES: Record<string, MappingProfile> = {
  'blackbaud-re-nxt:standard': {
    system_id: 'blackbaud-re-nxt',
    environment_variant: 'standard',
    version_label: 'NXT standard constituent export',
    field_paths: {
      source_record_id: 'constituent.id',
      household_id: 'constituent.household_id',
      first_name: 'constituent.first_name',
      middle_name: 'constituent.middle_name',
      last_name: 'constituent.last_name',
      prefix: 'constituent.title',
      email: 'constituent.email.address',
      email_type: 'constituent.email.type',
      phone: 'constituent.phone.number',
      phone_type: 'constituent.phone.type',
      school_name: 'education.school',
      class_year: 'education.class_year',
      relationship_type: 'education.relationship',
      email_consent: 'consent.email',
      record_confidence: 'integration.confidence',
    },
    transforms: {
      source_record_id: ['trim'],
      first_name: ['trim'],
      last_name: ['trim'],
      email: ['trim', 'lowercase'],
    },
    required_fields: ['source_record_id'],
    known_quirks: [
      'The household identifier can be absent for records imported without a household link.',
      'Education fields can describe either an adult relationship or a child record.',
    ],
  },
  'blackbaud-re-nxt:legacy-custom': {
    system_id: 'blackbaud-re-nxt',
    environment_variant: 'legacy-custom',
    version_label: 'NXT legacy custom export',
    field_paths: {
      source_record_id: 'id',
      household_id: 'custom_fields.household_key',
      first_name: 'name.given',
      middle_name: 'name.middle',
      last_name: 'name.family',
      prefix: 'name.salutation',
      email: 'custom_fields.primary_email',
      email_type: 'custom_fields.email_type',
      phone: 'phones.primary',
      school_name: 'attributes.school_name',
      class_year: 'attributes.class_year',
      relationship_type: 'attributes.relationship',
      email_consent: 'preferences.email_opt_in',
      record_confidence: 'attributes.record_confidence',
    },
    transforms: {
      source_record_id: ['trim'],
      first_name: ['trim'],
      last_name: ['trim'],
      email: ['trim', 'lowercase'],
    },
    required_fields: ['source_record_id'],
    known_quirks: [
      'The primary email is stored in a custom field rather than the contact export.',
      'Custom fields can contain empty strings instead of missing values.',
    ],
  },
  'salesforce:standard': {
    system_id: 'salesforce',
    environment_variant: 'standard',
    version_label: 'Contact export',
    field_paths: {
      source_record_id: 'Id',
      household_id: 'AccountId',
      first_name: 'FirstName',
      last_name: 'LastName',
      prefix: 'Salutation',
      email: 'Email',
      phone: 'MobilePhone',
      school_name: 'School__c',
      class_year: 'Class_Year__c',
      relationship_type: 'Relationship__c',
      email_consent: 'HasOptedOutOfEmail',
      record_confidence: 'Record_Confidence__c',
    },
    transforms: {
      source_record_id: ['trim'],
      first_name: ['trim'],
      last_name: ['trim'],
      email: ['trim', 'lowercase'],
    },
    required_fields: ['source_record_id'],
    known_quirks: [
      'Email opt-out has the opposite meaning of an email consent flag.',
      'Custom school and relationship fields depend on the organization configuration.',
    ],
  },
};

export function applyProfile(rawRecord: unknown, profile: MappingProfile): ApplyProfileResult {
  if (!isRecord(rawRecord)) {
    return {
      ok: false,
      errors: [{ code: 'invalid_record', field: 'record', message: 'The source record must be an object.' }],
    };
  }

  const errors: MappingError[] = [];
  const sourceRecordId = readString(rawRecord, profile, 'source_record_id');

  if (!sourceRecordId) {
    return {
      ok: false,
      errors: [{
        code: 'missing_required_field',
        field: 'source_record_id',
        message: 'The source record does not contain an identifier.',
      }],
    };
  }

  for (const field of profile.required_fields) {
    if (field === 'source_record_id') continue;
    if (!hasCanonicalValue(field, rawRecord, profile)) {
      errors.push({
        code: 'missing_required_field',
        field,
        message: `The source record does not contain required field ${field}.`,
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const email = readString(rawRecord, profile, 'email');
  const emailType = emailTypeFor(readString(rawRecord, profile, 'email_type'));
  const phone = readString(rawRecord, profile, 'phone');
  const schoolName = readString(rawRecord, profile, 'school_name');
  const relationshipType = readString(rawRecord, profile, 'relationship_type');
  const classYear = readNumber(rawRecord, profile, 'class_year');
  const confidence = readNumber(rawRecord, profile, 'record_confidence');
  const emailConsent = readBoolean(rawRecord, profile, 'email_consent');

  const constituent: CanonicalConstituent = {
    constituent_id: `${profile.system_id}:${sourceRecordId}`,
    source_system: profile.system_id,
    source_record_id: sourceRecordId,
    household_id: readString(rawRecord, profile, 'household_id'),
    household_role: 'unresolved',
    first_name: readString(rawRecord, profile, 'first_name'),
    middle_name: readString(rawRecord, profile, 'middle_name'),
    last_name: readString(rawRecord, profile, 'last_name'),
    prefix: readString(rawRecord, profile, 'prefix'),
    emails: email ? [{ value: email, type: emailType, is_valid: true }] : [],
    phones: phone ? [{ value: phone, type: phoneTypeFor(readString(rawRecord, profile, 'phone_type')) }] : [],
    addresses: [],
    affiliations:
      schoolName && relationshipType
        ? [{ school_name: schoolName, class_year: classYear, relationship_type: relationshipType }]
        : [],
    consent_flags: {
      email: profile.system_id === 'salesforce' && emailConsent !== undefined ? !emailConsent : emailConsent,
    },
    record_confidence: clampConfidence(confidence ?? 0),
  };

  const normalized = normalizeCanonicalConstituent(constituent);
  if (!isCanonicalConstituent(normalized)) {
    return {
      ok: false,
      errors: [{ code: 'invalid_value', field: 'record', message: 'The mapped record has an invalid canonical shape.' }],
    };
  }

  return { ok: true, constituent: normalized };
}

function hasCanonicalValue(field: keyof CanonicalConstituent, rawRecord: Record<string, unknown>, profile: MappingProfile): boolean {
  const sourceField = field === 'emails' ? 'email' : field;
  const value = getPath(rawRecord, profile.field_paths[sourceField]);
  return value !== undefined && value !== null && value !== '';
}

function readString(rawRecord: Record<string, unknown>, profile: MappingProfile, field: string): string | undefined {
  const path = profile.field_paths[field];
  const value = getPath(rawRecord, path);
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;

  const transforms = profile.transforms[field] ?? [];
  let normalized = String(value);
  if (transforms.includes('first_item')) normalized = normalized.split(',')[0] ?? '';
  if (transforms.includes('split_name')) normalized = normalized.split(/\s+/)[0] ?? '';
  if (transforms.includes('trim')) normalized = normalized.trim();
  if (transforms.includes('lowercase')) normalized = normalized.toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function readNumber(rawRecord: Record<string, unknown>, profile: MappingProfile, field: string): number | undefined {
  const value = getPath(rawRecord, profile.field_paths[field]);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(rawRecord: Record<string, unknown>, profile: MappingProfile, field: string): boolean | undefined {
  const value = getPath(rawRecord, profile.field_paths[field]);
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function getPath(record: Record<string, unknown>, path: string | undefined): unknown {
  if (!path) return undefined;

  let value: unknown = record;
  for (const part of path.split('.')) {
    if (!isRecord(value)) return undefined;
    value = value[part];
  }
  return value;
}

function emailTypeFor(value: string | undefined): CanonicalEmail['type'] {
  const normalized = value?.toLowerCase();
  if (normalized === 'personal' || normalized === 'work' || normalized === 'school') return normalized;
  return 'other';
}

function phoneTypeFor(value: string | undefined): 'mobile' | 'home' | 'work' | 'other' {
  const normalized = value?.toLowerCase();
  if (normalized === 'mobile' || normalized === 'home' || normalized === 'work') return normalized;
  return 'other';
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
