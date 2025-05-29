import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';
import { shouldShowCompany } from '@chti/shared';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { weights?: { ai: number; market: number; funding: number; team: number; regulatory: number }, top?: number } | null;
  const weights = body?.weights ?? { ai: 0.3, market: 0.25, funding: 0.2, team: 0.15, regulatory: 0.1 };
  const top = Math.min(Math.max(1, body?.top ?? 20), 200);
  const companies = (await prisma.company.findMany({ orderBy: { updatedAt: 'desc' }, take: top * 2 })).filter(shouldShowCompany).slice(0, top);
  const preview = companies.map(c => {
    // naive back-calc proportionally from totalScore; in production, recompute from snapshots/raw factors
    const total = c.totalScore;
    return { id: c.id, name: c.name, prev: total, next: total /* placeholder */ };
  });
  return NextResponse.json({ weights, preview });
}

