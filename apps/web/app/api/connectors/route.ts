import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';

function isAdmin(req: Request) {
  const key = req.headers.get('x-admin-key');
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

export async function GET() {
  const items = await prisma.connector.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const created = await prisma.connector.create({ data: body });
  return NextResponse.json(created);
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const updated = await prisma.connector.update({ where: { id: body.id }, data: body });
  return NextResponse.json(updated);
}

