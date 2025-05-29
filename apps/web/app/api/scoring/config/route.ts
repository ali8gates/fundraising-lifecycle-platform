import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';

function isAdmin(req: Request) {
  const key = req.headers.get('x-admin-key');
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const weights = {
    ai: Number(formData.get('w_ai') ?? 0.3),
    market: Number(formData.get('w_market') ?? 0.25),
    funding: Number(formData.get('w_funding') ?? 0.2),
    team: Number(formData.get('w_team') ?? 0.15),
    regulatory: Number(formData.get('w_regulatory') ?? 0.1),
  };
  const thresholds = {
    pass_to_review_threshold: Number(formData.get('t_review') ?? 0.55),
    outreach_threshold: Number(formData.get('t_outreach') ?? 0.7),
  };

  await prisma.appConfig.upsert({ where: { id: 1 }, update: { weights, thresholds }, create: { id: 1, weights, thresholds } });

  // Optionally recompute gates for all companies (MVP: skip heavy recompute here)
  return NextResponse.redirect(new URL('/scoring', process.env.APP_BASE_URL ?? 'http://localhost:3000'));
}

