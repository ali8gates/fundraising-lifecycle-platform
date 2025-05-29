/**
 * Fit result types. internal_score is backend-only; never expose to UI.
 *
 * Primary routing: one offering per company (mutually exclusive).
 * - AI Assessment Lab if eligible; else Innovators Network (INNOVATOR or INTEGRATOR); else NEITHER.
 * No BOTH. Tier is INNOVATOR or INTEGRATOR only when primary is Innovators Network.
 */

export type InnovatorsNetworkTier = 'INNOVATOR' | 'INTEGRATOR' | 'BOTH' | 'NEITHER';

export type OverallRecommendation = 'INNOVATORS_NETWORK' | 'AI_ASSESSMENT_LAB' | 'BOTH' | 'NEITHER';

/** Primary recommendation: single offering (Lab wins; no BOTH). */
export type PrimaryRecommendation = 'AI_ASSESSMENT_LAB' | 'INNOVATORS_NETWORK' | 'NEITHER';

export type InnovatorsNetworkFitResult = {
  recommended_tier: InnovatorsNetworkTier;
  reasons: string[];
  /** Backend-only; do not send to UI */
  internal_score?: number;
};

export type ExtractedCriteria = {
  deviceType?: string;
  therapeuticAreas: string[];
  modalities: string[];
  groundTruthSources: string[];
};

export type AssessmentLabFitResult = {
  eligible: boolean;
  reasons: string[];
  extracted_criteria: ExtractedCriteria;
  /** Backend-only; do not send to UI */
  internal_score?: number;
};

export type CompanyFitResult = {
  innovators_network_fit: InnovatorsNetworkFitResult;
  assessment_lab_fit: AssessmentLabFitResult;
  overall_recommendation: OverallRecommendation;
};

/** Input for fit engine: company fields + combined text from signals */
export type CompanyForFit = {
  name: string;
  description?: string | null;
  website?: string | null;
  specialties?: string[];
  /** Combined title + summary from company signals for signal extraction */
  signalsText?: string;
  /** Text extracted from company website (homepage + optional /about, /product, /solutions) for enrichment */
  enrichedWebText?: string;
};
