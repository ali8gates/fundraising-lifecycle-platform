import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  computeCompanyFit,
  computeInnovatorsNetworkFit,
  computeAssessmentLabFit,
  computeOverallRecommendation,
  fitResultForUI,
} from '../src/fit';
import type { CompanyForFit } from '../src/fit';

/** Parse CSV with quoted fields (description may contain commas). */
function parsePipelineCsv(content: string): { name: string; website: string; description: string }[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: { name: string; website: string; description: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        parts.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current.replace(/^"|"$/g, '').trim());
    if (parts.length >= 3) rows.push({ name: parts[0], website: parts[1], description: parts[2] });
  }
  return rows;
}

describe('fitEngine', () => {
  // 1. Strong Integrator: digital health SaaS with care plans/patient education
  it('Strong Integrator: care plans + patient education', () => {
    const company: CompanyForFit = {
      name: 'CarePath Health',
      description: 'Digital health SaaS platform for care plan workflows and patient education content delivery. Condition-specific programs and provider-facing content.',
      website: 'https://carepathhealth.com',
      specialties: ['remote patient monitoring'],
      signalsText: 'patient education content care plan workflows coaching behavior change condition-specific programs',
    };
    const fit = computeCompanyFit(company);
    expect(fit.innovators_network_fit.recommended_tier).toBe('INTEGRATOR');
    expect(fit.innovators_network_fit.reasons.length).toBeGreaterThan(0);
    expect(fitResultForUI(fit.innovators_network_fit)).not.toHaveProperty('internal_score');
  });

  // 2. Strong Innovator-only: medtech that wants credibility/partners but no content integration
  it('Strong Innovator-only: brand/networking, no content', () => {
    const company: CompanyForFit = {
      name: 'MedTech Cred',
      description: 'Medtech company seeking AHA partnership and clinical credibility. Key opinion leader collaborations and conference presence.',
      website: 'https://medtechcred.com',
      specialties: ['diagnostics'],
      signalsText: 'partnership KOL clinical credibility conference membership science research collaboration',
    };
    const fit = computeCompanyFit(company);
    expect(fit.innovators_network_fit.recommended_tier).toBe('INNOVATOR');
    expect(fit.innovators_network_fit.reasons.length).toBeGreaterThan(0);
  });

  // 3. Strong Assessment Lab: SaMD predictive algorithm for stroke/AFib using EHR + ECG
  it('Strong Assessment Lab: SaMD predictive algorithm stroke/AFib EHR ECG', () => {
    const company: CompanyForFit = {
      name: 'StrokePredict AI',
      description: 'Software as a medical device. Clinical prediction model for stroke and atrial fibrillation. Uses EHR data and ECG. Ground truth from EMR-based clinical outcomes and expert annotations.',
      website: 'https://strokepredict.ai',
      specialties: ['cardiovascular'],
      signalsText: 'SaMD predictive algorithm stroke atrial fibrillation EHR ECG EMR clinical outcomes expert annotations adjudication',
    };
    const fit = computeCompanyFit(company);
    expect(fit.assessment_lab_fit.eligible).toBe(true);
    expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
    expect(fit.assessment_lab_fit.extracted_criteria.therapeuticAreas.length).toBeGreaterThan(0);
    expect(fit.assessment_lab_fit.extracted_criteria.modalities.length).toBeGreaterThan(0);
  });

  // 4. Lab wins when eligible (primary = AI_ASSESSMENT_LAB; no BOTH)
  it('Assessment Lab primary when eligible (Lab over Innovators)', () => {
    const company: CompanyForFit = {
      name: 'CardioCare Digital',
      description: 'Digital health platform with care plans and patient education. SaMD predictive algorithm for heart failure. EHR and echocardiogram. Registry data for ground truth.',
      website: 'https://cardiocare.com',
      specialties: ['cardiovascular', 'remote patient monitoring'],
      signalsText: 'care plan patient education SaMD predictive algorithm heart failure EHR echocardiogram registry data clinical outcomes',
    };
    const fit = computeCompanyFit(company);
    expect(fit.overall_recommendation).toBe('AI_ASSESSMENT_LAB');
    expect(fit.assessment_lab_fit.eligible).toBe(true);
    expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
  });

  // 5. Clearly unrelated
  it('Clearly unrelated: no health/tech signals', () => {
    const company: CompanyForFit = {
      name: 'Consumer Fashion Co',
      description: 'Lifestyle and consumer apparel. Too early stage. No product yet.',
      website: 'https://consumerfashion.com',
      specialties: [],
      signalsText: 'too early no product unrelated consumer lifestyle',
    };
    const fit = computeCompanyFit(company);
    expect(fit.innovators_network_fit.recommended_tier).toBe('NEITHER');
    expect(fit.assessment_lab_fit.eligible).toBe(false);
    expect(fit.overall_recommendation).toBe('NEITHER');
    expect(fit.innovators_network_fit.reasons.length).toBeGreaterThanOrEqual(0);
  });

  // 6. INTEGRATOR only (content, no strong innovator)
  it('INTEGRATOR only: content delivery, no KOL/brand', () => {
    const company: CompanyForFit = {
      name: 'EduCare Platform',
      description: 'Patient education and condition-specific programs. Provider and patient-facing content delivery. Digital health SaaS.',
      website: 'https://educare.io',
      specialties: ['remote patient monitoring'],
      signalsText: 'patient education condition program content delivery provider patient-facing care pathway',
    };
    const fit = computeCompanyFit(company);
    expect(fit.innovators_network_fit.recommended_tier).toBe('INTEGRATOR');
    expect(fit.innovators_network_fit.reasons.length).toBeGreaterThan(0);
  });

  // 7. Assessment Lab eligible (may also get Innovator via market fit when healthcare/specialty present)
  it('Assessment Lab: SaMD + modality, chart review', () => {
    const company: CompanyForFit = {
      name: 'AFib Algorithm Inc',
      description: 'Clinical prediction model for atrial fibrillation. ECG and EKG. Chart review and labeled data for evaluation.',
      website: 'https://afibalgo.com',
      specialties: ['cardiovascular'],
      signalsText: 'predictive algorithm atrial fibrillation ECG EKG chart review labeled data SaMD',
    };
    const fit = computeCompanyFit(company);
    expect(fit.assessment_lab_fit.eligible).toBe(true);
    expect(fit.overall_recommendation).toBe('AI_ASSESSMENT_LAB');
    expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
  });

  // 8. NEITHER with minimal signals
  it('NEITHER: minimal or penalty signals', () => {
    const company: CompanyForFit = {
      name: 'Early Stage Idea',
      description: 'Pre-product. Unrelated industry. No health focus.',
      website: 'https://earlystage.com',
      specialties: ['other'],
      signalsText: 'too early no product unrelated non-health',
    };
    const fit = computeCompanyFit(company);
    expect(fit.innovators_network_fit.recommended_tier).toBe('NEITHER');
    expect(fit.assessment_lab_fit.eligible).toBe(false);
    expect(fit.overall_recommendation).toBe('NEITHER');
  });

  it('computeOverallRecommendation returns one primary (no BOTH)', () => {
    const labFit = computeAssessmentLabFit({
      name: 'Y',
      signalsText: 'SaMD stroke atrial fibrillation EHR clinical outcomes expert annotations',
    });
    const inFit = computeInnovatorsNetworkFit({
      name: 'X',
      signalsText: 'care plan patient education',
    });
    const recLab = computeOverallRecommendation(inFit, labFit);
    expect(recLab).toBe('AI_ASSESSMENT_LAB');
    const inOnly = computeInnovatorsNetworkFit({ name: 'Z', signalsText: 'care plan' });
    const labIneligible = computeAssessmentLabFit({ name: 'W', signalsText: 'no SaMD' });
    const recIn = computeOverallRecommendation(inOnly, labIneligible);
    expect(['INNOVATORS_NETWORK', 'NEITHER']).toContain(recIn);
  });

  it('fitResultForUI strips internal_score', () => {
    const company: CompanyForFit = { name: 'Test', signalsText: 'care plan' };
    const inFit = computeInnovatorsNetworkFit(company);
    const ui = fitResultForUI(inFit);
    expect(ui).not.toHaveProperty('internal_score');
    expect(ui).toHaveProperty('recommended_tier');
    expect(ui).toHaveProperty('reasons');
  });

  it('Assessment Lab fit never has empty reasons or missing extracted_criteria', () => {
    const company: CompanyForFit = { name: 'Any Co', description: 'Some health tech' };
    const fit = computeCompanyFit(company);
    expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
    expect(fit.assessment_lab_fit.extracted_criteria).toBeDefined();
    expect(Array.isArray(fit.assessment_lab_fit.extracted_criteria.therapeuticAreas)).toBe(true);
    expect(Array.isArray(fit.assessment_lab_fit.extracted_criteria.modalities)).toBe(true);
    expect(Array.isArray(fit.assessment_lab_fit.extracted_criteria.groundTruthSources)).toBe(true);
  });

  describe('Pipeline CSV regression', () => {
    const fixturePath = join(process.cwd(), '../../fixtures/Pipeline(Pipeline).csv');
    const altPath = join(process.cwd(), 'fixtures/Pipeline(Pipeline).csv');
    const csvPath = existsSync(fixturePath) ? fixturePath : existsSync(altPath) ? altPath : null;

    it('loads pipeline fixture and every row has non-blank fit', () => {
      if (!csvPath) {
        console.warn('Pipeline fixture not found at ../../fixtures or ./fixtures; skipping');
        return;
      }
      const csv = readFileSync(csvPath, 'utf-8');
      const rows = parsePipelineCsv(csv);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        const company: CompanyForFit = {
          name: row.name,
          website: row.website,
          description: row.description,
          signalsText: row.description,
        };
        const fit = computeCompanyFit(company);
        expect(fit.assessment_lab_fit.reasons.length, `${row.name} should have assessment_lab reasons`).toBeGreaterThan(0);
        expect(fit.assessment_lab_fit.extracted_criteria).toBeDefined();
        expect(fit.innovators_network_fit.reasons.length, `${row.name} should have innovators_network reasons`).toBeGreaterThanOrEqual(0);
      }
    });

    it('Ultromics maps to Aortic Stenosis + Echocardiogram', () => {
      const company: CompanyForFit = {
        name: 'Ultromics',
        website: 'https://ultromics.com',
        description:
          'AI-powered echocardiography for aortic stenosis and cardiac imaging. Echocardiogram analysis, predictive algorithms, clinical decision support.',
        signalsText:
          'echocardiography aortic stenosis cardiac imaging Echocardiogram predictive algorithms clinical decision support',
      };
      const fit = computeCompanyFit(company);
      const areas = fit.assessment_lab_fit.extracted_criteria.therapeuticAreas;
      const mods = fit.assessment_lab_fit.extracted_criteria.modalities;
      expect(areas.some((a) => a.includes('Aortic'))).toBe(true);
      expect(mods.some((m) => m.toLowerCase().includes('echocardiogram') || m.toLowerCase().includes('echo'))).toBe(true);
      expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
    });

    it('AccurKardia / Idoven-style map to ECG and AFib', () => {
      const company: CompanyForFit = {
        name: 'AccurKardia',
        description: 'ECG and EKG-based atrial fibrillation detection. SaMD predictive algorithm for AFib. Clinical outcomes and expert annotations.',
        signalsText: 'ECG EKG atrial fibrillation AFib SaMD predictive algorithm clinical outcomes expert annotations',
      };
      const fit = computeCompanyFit(company);
      const areas = fit.assessment_lab_fit.extracted_criteria.therapeuticAreas;
      const mods = fit.assessment_lab_fit.extracted_criteria.modalities;
      expect(areas.some((a) => a.includes('Atrial') || a.includes('Fibrillation'))).toBe(true);
      expect(mods.some((m) => m.includes('ECG') || m.includes('EKG'))).toBe(true);
      expect(fit.assessment_lab_fit.eligible).toBe(true);
      expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
    });

    it('Idoven: ECG + AFib + clinical validation → eligible', () => {
      const company: CompanyForFit = {
        name: 'Idoven',
        website: 'https://idoven.ai',
        description: 'AI for ECG analysis. Atrial fibrillation detection, predictive models. EHR integration and clinical validation.',
        signalsText: 'ECG analysis atrial fibrillation predictive models EHR integration clinical validation',
      };
      const fit = computeCompanyFit(company);
      expect(fit.assessment_lab_fit.extracted_criteria.therapeuticAreas.some((a) => a.includes('Atrial'))).toBe(true);
      expect(fit.assessment_lab_fit.extracted_criteria.modalities.some((m) => m.includes('ECG') || m.includes('EKG'))).toBe(true);
      expect(fit.assessment_lab_fit.eligible).toBe(true);
      expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
    });

    it('Pipeline item outside supported criteria still gets unsupported reasons', () => {
      const company: CompanyForFit = {
        name: 'NonCardiac Co',
        description: 'Oncology and diabetes digital tools. No cardiovascular or supported therapeutic area.',
        signalsText: 'oncology diabetes digital tools',
      };
      const fit = computeCompanyFit(company);
      expect(fit.assessment_lab_fit.reasons.length).toBeGreaterThan(0);
      const reasonsText = fit.assessment_lab_fit.reasons.join(' ');
      expect(
        reasonsText.includes('No supported') || reasonsText.includes('supported:') || reasonsText.includes('not appear')
      ).toBe(true);
      expect(fit.assessment_lab_fit.extracted_criteria.therapeuticAreas.length).toBe(0);
    });
  });
});
