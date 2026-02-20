/**
 * Classifier entry points: assessmentLabEligibility, innovatorsTier, routeRecommendation.
 * Normalize synonyms in taxonomy; route to ONE primary offering (Lab > Innovators > NEITHER).
 */

import { extractCompanySignals } from './extractCompanySignals';
import { computeAssessmentLabFit, computeInnovatorsNetworkFit, computeOverallRecommendation } from './fitEngine';
import type { CompanyForFit } from './types';
import type { AssessmentLabFitResult, InnovatorsNetworkFitResult } from './types';
import type { PrimaryRecommendation } from './types';

/** Assessment Lab eligibility: eligible only if SaMD predictive + supported area/modality + ground truth. Always returns reasons. */
export function assessmentLabEligibility(company: CompanyForFit): {
  eligible: boolean;
  extractedCriteria: AssessmentLabFitResult['extracted_criteria'];
  reasons: string[];
} {
  const signals = extractCompanySignals(company);
  const result = computeAssessmentLabFit(company, signals);
  return {
    eligible: result.eligible,
    extractedCriteria: result.extracted_criteria,
    reasons: result.reasons,
  };
}

/** Innovators Network tier (only when NOT Lab eligible): INTEGRATOR or INNOVATOR; never BOTH. */
export function innovatorsTier(company: CompanyForFit): {
  tier: InnovatorsNetworkFitResult['recommended_tier'];
  reasons: string[];
} {
  const signals = extractCompanySignals(company);
  const result = computeInnovatorsNetworkFit(company, signals);
  return {
    tier: result.recommended_tier,
    reasons: result.reasons,
  };
}

/** Route to ONE primary offering: AI_ASSESSMENT_LAB if eligible, else INNOVATORS_NETWORK, else NEITHER. */
export function routeRecommendation(company: CompanyForFit): PrimaryRecommendation {
  const signals = extractCompanySignals(company);
  const lab = computeAssessmentLabFit(company, signals);
  const inFit = computeInnovatorsNetworkFit(company, signals);
  const rec = computeOverallRecommendation(inFit, lab);
  return rec === 'BOTH' ? 'AI_ASSESSMENT_LAB' : (rec as PrimaryRecommendation);
}
