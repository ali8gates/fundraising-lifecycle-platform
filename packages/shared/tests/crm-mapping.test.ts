import { describe, expect, it } from 'vitest';
import { normalizeCanonicalConstituent } from '../src/crm/canonical';
import { applyProfile, MAPPING_PROFILES } from '../src/crm/mapping';

describe('CRM mapping profiles', () => {
  it('maps the same raw record differently under the two environment profiles', () => {
    const rawRecord = {
      constituent: {
        id: 'standard-id',
        first_name: ' Standard ',
        email: { address: 'STANDARD@EXAMPLE.NET', type: 'personal' },
      },
      id: 'legacy-id',
      name: { given: ' Legacy ' },
      custom_fields: { primary_email: 'LEGACY@EXAMPLE.NET' },
    };

    const standard = applyProfile(rawRecord, MAPPING_PROFILES['blackbaud-re-nxt:standard']);
    const legacy = applyProfile(rawRecord, MAPPING_PROFILES['blackbaud-re-nxt:legacy-custom']);

    expect(standard).toMatchObject({
      ok: true,
      constituent: {
        source_record_id: 'standard-id',
        first_name: 'Standard',
        emails: [{ value: 'standard@example.net' }],
      },
    });
    expect(legacy).toMatchObject({
      ok: true,
      constituent: {
        source_record_id: 'legacy-id',
        first_name: 'Legacy',
        emails: [{ value: 'legacy@example.net' }],
      },
    });
  });

  it('returns structured errors instead of throwing on a bad input', () => {
    const result = applyProfile(null, MAPPING_PROFILES['salesforce:standard']);

    expect(result).toEqual({
      ok: false,
      errors: [{ code: 'invalid_record', field: 'record', message: 'The source record must be an object.' }],
    });
  });

  it('normalizes email values and removes obvious placeholders', () => {
    const normalized = normalizeCanonicalConstituent({
      constituent_id: 'system:record',
      source_system: 'system',
      source_record_id: 'record',
      household_role: 'unresolved',
      emails: [
        { value: ' PERSON@EXAMPLE.NET ', type: 'personal', is_valid: true },
        { value: 'unknown', type: 'other', is_valid: true },
      ],
      phones: [],
      addresses: [],
      affiliations: [],
      consent_flags: {},
      record_confidence: 0,
    });

    expect(normalized.emails).toEqual([
      { value: 'person@example.net', type: 'personal', is_valid: true },
    ]);
  });
});
