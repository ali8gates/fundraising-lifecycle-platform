import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const c = await prisma.company.findUnique({ where: { id: params.id }, include: { signals: true, meetings: true, outreachEvents: true } });
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(c);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.company.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

