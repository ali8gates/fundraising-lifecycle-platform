import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';
import { shouldShowCompany, computeCompanyFit, fitResultForUI, isGoodFitRecommendation, isHealthcareSignal, isSeedDemoCompany } from '@chti/shared';

function companyForFit(c: { name: string; description?: string | null; website?: string | null; specialties: string[]; signals?: { title: string; summary?: string | null }[]; enrichedWebText?: string | null }) {
  const signalsText = (c.signals ?? []).map((s) => `${s.title} ${s.summary ?? ''}`).join(' ');
  return { name: c.name, description: c.description, website: c.website, specialties: c.specialties, signalsText: signalsText || undefined, enrichedWebText: c.enrichedWebText ?? undefined };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const c = await prisma.company.findUnique({ where: { id: params.id }, include: { signals: true, meetings: true } });
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!shouldShowCompany(c) || isSeedDemoCompany(c)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
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
  if (!isGoodFitRecommendation(fit.overall_recommendation)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { internal_score: _1, ...inFit } = fit.innovators_network_fit;
  const { internal_score: _2, ...labFit } = fit.assessment_lab_fit;
  const healthcareSignals = (c.signals ?? []).filter((s: { sourceName?: string | null; url?: string | null; title?: string | null; summary?: string | null }) => isHealthcareSignal(s));
  return NextResponse.json({
    ...c,
    signals: healthcareSignals,
    innovators_network_fit: inFit,
    assessment_lab_fit: labFit,
    overall_recommendation: fit.overall_recommendation,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.company.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

