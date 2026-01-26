export type ProgramFit = 'strong' | 'possible' | 'not_fit' | 'unknown';

export type CompanyWithSignals = {
  totalScore?: number;
  signals?: any[];
  stage?: string;
  fundingStage?: string;
  meetings?: any[];
};

/**
 * Compute the program fit for AI Innovators Network based on company data signals.
 * 
 * TODO: Replace with real scoring logic from backend that considers:
 * - AI sophistication score
 * - Signal volume and recency
 * - Funding stage alignment
 * - Sector focus
 * - Engagement history
 */
export function computeInnovatorsNetworkFit(company: CompanyWithSignals): ProgramFit {
  // Placeholder logic based on available data signals
  const score = company.totalScore ?? 0;
  const signalCount = company.signals?.length ?? 0;
  
  // Strong fit: High score and good signal coverage
  if (score >= 0.75 && signalCount >= 3) return 'strong';
  
  // Possible fit: Moderate score or emerging signals
  if (score >= 0.50 && signalCount >= 1) return 'possible';
  
  // Not a fit: Low score and limited signals
  if (score < 0.30) return 'not_fit';
  
  return 'unknown';
}

/**
 * Compute the program fit for AI Assessment Lab based on company data signals.
 * 
 * TODO: Replace with real scoring logic from backend that considers:
 * - Company stage/maturity
 * - Funding stage (preferring Series A-C)
 * - Team strength signals
 * - Regulatory positioning
 * - Prior engagement/meetings
 */
export function computeAiAssessmentLabFit(company: CompanyWithSignals): ProgramFit {
  const stage = company.stage ?? 'NEW';
  const fundingStage = company.fundingStage ?? 'OTHER';
  const meetingCount = company.meetings?.length ?? 0;
  
  // Strong fit: Qualified/in discussion stage with Series A-C funding and existing engagement
  if (['QUALIFIED', 'IN_DISCUSSION', 'MEETING_SCHEDULED'].includes(stage) && 
      ['SERIES_A', 'SERIES_B', 'SERIES_C'].includes(fundingStage) &&
      meetingCount > 0) {
    return 'strong';
  }
  
  // Possible fit: Outreach stage or moderate funding with some engagement
  if (['OUTREACH', 'QUALIFIED'].includes(stage) || meetingCount > 0) {
    return 'possible';
  }
  
  // Not a fit: Archived or very early stage with no engagement
  if (stage === 'ARCHIVED' || (stage === 'NEW' && meetingCount === 0)) {
    return 'not_fit';
  }
  
  return 'unknown';
}

export function getFitLabel(fit: ProgramFit): string {
  const labels: Record<ProgramFit, string> = {
    strong: 'Strong Fit',
    possible: 'Possible Fit',
    not_fit: 'Not a Fit',
    unknown: 'Unknown',
  };
  return labels[fit] ?? 'Unknown';
}

export function getFitColor(fit: ProgramFit): string {
  const colors: Record<ProgramFit, string> = {
    strong: 'bg-emerald-100 text-emerald-700',
    possible: 'bg-amber-100 text-amber-700',
    not_fit: 'bg-slate-100 text-slate-700',
    unknown: 'bg-gray-100 text-gray-700',
  };
  return colors[fit] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Check if a company is a fit (strong or possible) for an initiative
 */
export function isGoodFit(fit: ProgramFit): boolean {
  return fit === 'strong' || fit === 'possible';
}

/**
 * Get fitting initiatives for a company
 * Returns array of initiative names the company is a good fit for
 */
export function getFittingInitiatives(
  innovatorsNetworkFit: ProgramFit,
  aiAssessmentLabFit: ProgramFit
): string[] {
  const fitting: string[] = [];
  if (isGoodFit(innovatorsNetworkFit)) fitting.push('AI Innovators Network');
  if (isGoodFit(aiAssessmentLabFit)) fitting.push('AI Assessment Lab');
  return fitting;
}

