/**
 * Extract fit-relevant signals from company fields and signal text.
 * Used as input to fitEngine for deterministic tier/eligibility.
 */

import {
  ASSESSMENT_LAB_THERAPEUTIC_AREAS,
  THERAPEUTIC_AREA_SYNONYMS,
  ASSESSMENT_LAB_MODALITIES,
  MODALITY_SYNONYMS,
  DEVICE_TYPE_SYNONYMS,
  GROUND_TRUTH_SIGNALS,
} from './taxonomy';
import type { CompanyForFit } from './types';

export type ExtractedSignals = {
  // Innovators Network: health-tech relevance
  healthTechRelevance: boolean;
  healthTechKeywords: string[];
  // Innovator: brand/networking/credibility
  innovatorSignals: boolean;
  innovatorKeywords: string[];
  // Integrator: content/care plan/education
  integratorSignals: boolean;
  integratorKeywords: string[];
  // Penalty: too early / unrelated
  penaltySignals: boolean;
  penaltyKeywords: string[];
  // Assessment Lab
  deviceTypeMatch: boolean;
  deviceTypeKeywords: string[];
  therapeuticAreas: string[];
  modalities: string[];
  groundTruthSources: string[];
};

const HEALTH_TECH_TERMS = [
  'digital health',
  'healthtech',
  'health tech',
  'medtech',
  'med tech',
  'healthcare',
  'health care',
  'care',
  'payer',
  'provider',
  'clinical',
  'patient',
  'medical device',
  'saas',
  'paas',
  'platform',
  'cardiovascular',
  'diagnostics',
  'remote patient',
  'telehealth',
  'ai-enabled',
  'ai enabled',
  'startup',
  'therapy',
  'hospital',
  'clinic',
];

const INNOVATOR_TERMS = [
  'partnership',
  'partner',
  'kol',
  'key opinion leader',
  'clinical credibility',
  'conference',
  'aha',
  'american heart',
  'brand',
  'networking',
  'membership',
  'science',
  'research collaboration',
];

const INTEGRATOR_TERMS = [
  'care plan',
  'careplan',
  'patient education',
  'patient content',
  'condition program',
  'condition-specific',
  'coaching',
  'behavior change',
  'content delivery',
  'provider content',
  'patient-facing',
  'licensed content',
  'care pathway',
  'remote monitoring',
  'education layer',
  'digital therapeutic',
];

const PENALTY_TERMS = [
  'too early',
  'pre-product',
  'no product',
  'unrelated',
  'non-health',
  'consumer only',
  'lifestyle only',
];

function toLower(s: string): string {
  return s.toLowerCase();
}

function findMatches(text: string, terms: string[]): string[] {
  const lower = toLower(text);
  return terms.filter((t) => lower.includes(t));
}

function extractTherapeuticAreas(text: string): string[] {
  const lower = toLower(text);
  const found = new Set<string>();
  for (const [syn, canonical] of Object.entries(THERAPEUTIC_AREA_SYNONYMS)) {
    if (lower.includes(syn)) found.add(canonical);
  }
  for (const area of ASSESSMENT_LAB_THERAPEUTIC_AREAS) {
    if (lower.includes(toLower(area))) found.add(area);
  }
  return Array.from(found);
}

function extractModalities(text: string): string[] {
  const lower = toLower(text);
  const found = new Set<string>();
  for (const [syn, canonical] of Object.entries(MODALITY_SYNONYMS)) {
    if (lower.includes(syn)) found.add(canonical);
  }
  for (const mod of ASSESSMENT_LAB_MODALITIES) {
    if (lower.includes(toLower(mod))) found.add(mod);
  }
  return Array.from(found);
}

function extractGroundTruth(text: string): string[] {
  const lower = toLower(text);
  const found: string[] = [];
  for (const sig of GROUND_TRUTH_SIGNALS) {
    if (lower.includes(sig)) found.push(sig);
  }
  return found;
}

function hasDeviceTypeMatch(text: string): boolean {
  const lower = toLower(text);
  return DEVICE_TYPE_SYNONYMS.some((s) => lower.includes(s));
}

/**
 * Extract all signals from company + combined signal text.
 */
export function extractCompanySignals(company: CompanyForFit): ExtractedSignals {
  const text = [
    company.name,
    company.description ?? '',
    company.website ?? '',
    (company.specialties ?? []).join(' '),
    company.signalsText ?? '',
    company.enrichedWebText ?? '',
  ].join(' ');
  const lower = toLower(text);

  const healthTechKeywords = findMatches(text, HEALTH_TECH_TERMS);
  const innovatorKeywords = findMatches(text, INNOVATOR_TERMS);
  const integratorKeywords = findMatches(text, INTEGRATOR_TERMS);
  const penaltyKeywords = findMatches(text, PENALTY_TERMS);
  const deviceTypeKeywords = DEVICE_TYPE_SYNONYMS.filter((s) => lower.includes(s));

  return {
    healthTechRelevance: healthTechKeywords.length > 0,
    healthTechKeywords,
    innovatorSignals: innovatorKeywords.length > 0,
    innovatorKeywords,
    integratorSignals: integratorKeywords.length > 0,
    integratorKeywords,
    penaltySignals: penaltyKeywords.length > 0,
    penaltyKeywords,
    deviceTypeMatch: hasDeviceTypeMatch(text),
    deviceTypeKeywords,
    therapeuticAreas: extractTherapeuticAreas(text),
    modalities: extractModalities(text),
    groundTruthSources: extractGroundTruth(text),
  };
}
