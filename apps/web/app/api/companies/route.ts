import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const stage = searchParams.get('stage') ?? '';
  const minScore = Number(searchParams.get('minScore') ?? '0');
  const maxScore = Number(searchParams.get('maxScore') ?? '1');
  const items = await prisma.company.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { website: { contains: q, mode: 'insensitive' } }] } : {},
        specialty ? { specialties: { has: specialty } } : {},
        stage ? { stage: stage as any } : {},
        { totalScore: { gte: isNaN(minScore) ? 0 : minScore, lte: isNaN(maxScore) ? 1 : maxScore } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.company.create({ data: body });
  return NextResponse.json(created);
}

