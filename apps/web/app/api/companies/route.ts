import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';
import { shouldShowCompany, computeCompanyFit, fitResultForUI, isGoodFitRecommendation, isHealthcareSignal, isSeedDemoCompany } from '@chti/shared';

function companyForFit(c: { name: string; description?: string | null; website?: string | null; specialties: string[]; signals?: { title: string; summary?: string | null }[]; enrichedWebText?: string | null }) {
  const signalsText = (c.signals ?? []).map((s) => `${s.title} ${s.summary ?? ''}`).join(' ');
  return { name: c.name, description: c.description, website: c.website, specialties: c.specialties, signalsText: signalsText || undefined, enrichedWebText: c.enrichedWebText ?? undefined };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const stage = searchParams.get('stage') ?? '';
  const recommendation = searchParams.get('recommendation') ?? '';
  const tier = searchParams.get('tier') ?? '';
  const labEligible = searchParams.get('labEligible') ?? '';

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { website: { contains: q, mode: 'insensitive' } }] } : {},
        specialty ? { specialties: { has: specialty } } : {},
        stage ? { stage: stage as any } : {},
      ],
    },
    include: { signals: { orderBy: { publishedAt: 'desc' }, take: 10 } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const filtered = companies.filter((c) => shouldShowCompany(c) && !isSeedDemoCompany(c));

  const withFit = filtered.map((c) => {
    const useStored =
      c.innovatorsNetworkTier != null &&
      c.assessmentLabReasons != null &&
      Array.isArray(c.innovatorsNetworkReasons) &&
      Array.isArray(c.assessmentLabReasons);
    const fit = useStored
      ? {
          innovators_network_fit: { recommended_tier: c.innovatorsNetworkTier!, reasons: c.innovatorsNetworkReasons as string[] },
          assessment_lab_fit: {
            eligible: c.assessmentLabEligible ?? false,
            reasons: c.assessmentLabReasons as string[],
            extracted_criteria: (c.assessmentLabCriteria as { deviceType?: string; therapeuticAreas: string[]; modalities: string[]; groundTruthSources: string[] }) ?? { therapeuticAreas: [], modalities: [], groundTruthSources: [] },
          },
          overall_recommendation: c.overallRecommendation!,
        }
      : computeCompanyFit(companyForFit(c));
    const uiFit = {
      innovators_network_fit: fitResultForUI(fit.innovators_network_fit),
      assessment_lab_fit: fitResultForUI(fit.assessment_lab_fit),
      overall_recommendation: fit.overall_recommendation,
    };
    return { ...c, fit: uiFit };
  });

  // Only return companies that are a good fit
  const goodFitOnly = withFit.filter((row) => isGoodFitRecommendation(row.fit.overall_recommendation));

  const filteredByFit = goodFitOnly.filter((row) => {
    if (recommendation && row.fit.overall_recommendation !== recommendation) return false;
    if (tier && row.fit.innovators_network_fit.recommended_tier !== tier) return false;
    if (labEligible === 'yes' && !row.fit.assessment_lab_fit.eligible) return false;
    if (labEligible === 'no' && row.fit.assessment_lab_fit.eligible) return false;
    return true;
  });

  const items = filteredByFit.map(({ fit, ...company }) => {
    const healthcareSignals = (company.signals ?? []).filter((s: { sourceName?: string | null; url?: string | null; title?: string | null; summary?: string | null }) => isHealthcareSignal(s));
    return {
      ...company,
      signals: healthcareSignals,
      innovators_network_fit: fit.innovators_network_fit,
      assessment_lab_fit: fit.assessment_lab_fit,
      overall_recommendation: fit.overall_recommendation,
    };
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.company.create({ data: body });
  return NextResponse.json(created);
}
