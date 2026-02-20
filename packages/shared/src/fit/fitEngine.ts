/**
 * Deterministic fit engine: tier, eligible, reasons, extracted_criteria.
 * internal_score is backend-only; never expose to UI.
 */

import { extractCompanySignals, type ExtractedSignals } from './extractCompanySignals';
import type {
  CompanyForFit,
  InnovatorsNetworkFitResult,
  AssessmentLabFitResult,
  ExtractedCriteria,
  OverallRecommendation,
  InnovatorsNetworkTier,
} from './types';

const INNOVATORS_NETWORK_TIER_THRESHOLD = 15;
const INNOVATORS_NETWORK_MARKET_FIT_MIN = 10;

/**
 * Compute Innovators Network fit: tier + reasons + internal_score.
 */
export function computeInnovatorsNetworkFit(
  company: CompanyForFit,
  signals: ExtractedSignals = extractCompanySignals(company)
): InnovatorsNetworkFitResult {
  const reasons: string[] = [];
  let score = 0;

  // Base health-tech relevance: +0–25
  if (signals.healthTechRelevance) {
    const pts = Math.min(25, 5 + signals.healthTechKeywords.length * 3);
    score += pts;
    if (signals.healthTechKeywords.length > 0) {
      reasons.push(`Health-tech focus: ${signals.healthTechKeywords.slice(0, 2).join(', ')}.`);
    }
  }

  // Relationship/brand/networking: +0–25
  if (signals.innovatorSignals) {
    const pts = Math.min(25, 5 + signals.innovatorKeywords.length * 4);
    score += pts;
    if (signals.innovatorKeywords.length > 0) {
      reasons.push(`Brand/networking signals: ${signals.innovatorKeywords.slice(0, 2).join(', ')}.`);
    }
  }

  // Integrator content-fit: +0–35
  if (signals.integratorSignals) {
    const pts = Math.min(35, 10 + signals.integratorKeywords.length * 5);
    score += pts;
    if (signals.integratorKeywords.length > 0) {
      reasons.push(`Content/care delivery fit: ${signals.integratorKeywords.slice(0, 2).join(', ')}.`);
    }
  }

  // Penalties: -0–30
  if (signals.penaltySignals) {
    const penalty = Math.min(30, signals.penaltyKeywords.length * 10);
    score -= penalty;
    reasons.push('Some signals suggest early stage or unrelated focus.');
  }

  score = Math.max(0, Math.min(100, score));

  // Tier logic: include historical / market-fit companies (health-tech relevance = potential Innovator)
  const integratorStrong = signals.integratorSignals && score >= INNOVATORS_NETWORK_TIER_THRESHOLD;
  const innovatorStrong = signals.innovatorSignals && !signals.integratorSignals && score >= INNOVATORS_NETWORK_TIER_THRESHOLD;
  const marketFit = signals.healthTechRelevance && score >= INNOVATORS_NETWORK_MARKET_FIT_MIN && !signals.penaltySignals;

  // Mutually exclusive tier: INTEGRATOR if content/care delivery fit; INNOVATOR otherwise (no BOTH).
  let recommended_tier: InnovatorsNetworkTier = 'NEITHER';
  if (integratorStrong) {
    recommended_tier = 'INTEGRATOR';
    if (!reasons.some((r) => r.includes('Content/care'))) reasons.push('Strong fit for content/care integration.');
  } else if (innovatorStrong || marketFit) {
    recommended_tier = 'INNOVATOR';
    if (!reasons.some((r) => r.includes('Brand')) && !reasons.some((r) => r.includes('Health-tech')))
      reasons.push(innovatorStrong ? 'Good fit for membership and networking.' : 'Healthcare / market fit: relevant specialty or health-tech focus.');
  } else if (score >= 10) {
    reasons.push('Limited signals; consider manual review.');
  }

  if (reasons.length === 0 && recommended_tier === 'NEITHER') {
    reasons.push('No Innovators Network signals identified.');
  }

  return {
    recommended_tier,
    reasons: reasons.slice(0, 5),
    internal_score: score,
  };
}

const SUPPORTED_THERAPEUTIC_LIST = 'Aortic Stenosis, Atrial Fibrillation, CKM, Cardiogenic Shock, CAD, Heart Failure, Obesity, Resuscitation, Stroke';
const SUPPORTED_MODALITY_LIST = 'EMR/EHR, ECG/EKG, Echocardiogram, CT, MR, Xray/XR';

/**
 * Compute AI Assessment Lab fit: eligible + reasons + extracted_criteria + internal_score.
 * Eligible ONLY if: deviceType SaMD Predictive Algorithms AND (therapeutic area OR modality) AND feasible ground truth.
 * CRITICAL: Always return complete assessment_lab_fit with reasons (including what is missing). Never return blank.
 */
export function computeAssessmentLabFit(
  company: CompanyForFit,
  signals: ExtractedSignals = extractCompanySignals(company)
): AssessmentLabFitResult {
  const reasons: string[] = [];
  let score = 0;

  if (signals.deviceTypeMatch) {
    score += 35;
    reasons.push('Device type appears to be SaMD predictive algorithm (supported).');
  } else {
    reasons.push('Device type does not appear to be SaMD predictive algorithm.');
  }

  if (signals.therapeuticAreas.length > 0) {
    score += Math.min(25, 10 + signals.therapeuticAreas.length * 5);
    reasons.push(`Therapeutic area fit: ${signals.therapeuticAreas.slice(0, 4).join(', ')} (supported).`);
  } else {
    reasons.push(`No supported therapeutic area detected. Supported: ${SUPPORTED_THERAPEUTIC_LIST}.`);
  }

  if (signals.modalities.length > 0) {
    score += Math.min(20, 5 + signals.modalities.length * 4);
    reasons.push(`Modality fit: ${signals.modalities.slice(0, 4).join(', ')} (supported).`);
  } else {
    reasons.push(`No supported modality detected. Supported: ${SUPPORTED_MODALITY_LIST}.`);
  }

  if (signals.groundTruthSources.length > 0) {
    score += Math.min(15, 5 + signals.groundTruthSources.length * 3);
    reasons.push(`Ground truth / evaluation signals: ${signals.groundTruthSources.slice(0, 3).join(', ')}.`);
  } else {
    reasons.push('No ground truth or evaluation data signals detected. Need EMR-based clinical outcomes or expert annotations/labels.');
  }

  score = Math.max(0, Math.min(100, score));

  const deviceTypeSupported = signals.deviceTypeMatch;
  const areaOrModalityMatch = signals.therapeuticAreas.length > 0 || signals.modalities.length > 0;
  const hasGroundTruth = signals.groundTruthSources.length > 0;
  const eligible =
    deviceTypeSupported &&
    areaOrModalityMatch &&
    hasGroundTruth;

  if (!eligible) {
    if (!deviceTypeSupported) reasons.push('Eligibility requires SaMD predictive algorithm device type.');
    else if (!areaOrModalityMatch) reasons.push('Eligibility requires at least one supported therapeutic area or modality.');
    else if (!hasGroundTruth) reasons.push('Eligibility requires feasible ground truth: EMR-based clinical outcomes or expert annotations/labels.');
  }

  const extracted_criteria: ExtractedCriteria = {
    deviceType: signals.deviceTypeMatch ? 'SaMD Predictive Algorithms' : undefined,
    therapeuticAreas: [...signals.therapeuticAreas],
    modalities: [...signals.modalities],
    groundTruthSources: [...signals.groundTruthSources],
  };

  return {
    eligible,
    reasons: reasons.slice(0, 8),
    extracted_criteria,
    internal_score: score,
  };
}

/**
 * Route to ONE primary offering (mutually exclusive). Lab wins if eligible; else Innovators Network; else NEITHER. No BOTH.
 */
export function computeOverallRecommendation(
  innovators: InnovatorsNetworkFitResult,
  assessment: AssessmentLabFitResult
): OverallRecommendation {
  if (assessment.eligible) return 'AI_ASSESSMENT_LAB';
  if (innovators.recommended_tier !== 'NEITHER') return 'INNOVATORS_NETWORK';
  return 'NEITHER';
}

/**
 * Full company fit: both offerings + overall recommendation.
 */
export function computeCompanyFit(company: CompanyForFit): {
  innovators_network_fit: InnovatorsNetworkFitResult;
  assessment_lab_fit: AssessmentLabFitResult;
  overall_recommendation: OverallRecommendation;
} {
  const signals = extractCompanySignals(company);
  const innovators_network_fit = computeInnovatorsNetworkFit(company, signals);
  const assessment_lab_fit = computeAssessmentLabFit(company, signals);
  const overall_recommendation = computeOverallRecommendation(
    innovators_network_fit,
    assessment_lab_fit
  );
  return {
    innovators_network_fit,
    assessment_lab_fit,
    overall_recommendation,
  };
}

/** Strip internal_score for UI/API; never send to frontend */
export function fitResultForUI<T extends { internal_score?: number }>(r: T): Omit<T, 'internal_score'> {
  const { internal_score: _, ...rest } = r;
  return rest;
}
