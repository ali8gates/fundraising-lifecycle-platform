import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'chti_access';
const VALID_CODE = process.env.GATE_ACCESS_CODE || process.env.CHTI_GATE_CODE || '6101924';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body?.code ?? '').trim();

  if (code !== VALID_CODE) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, 'granted', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Session-only: no maxAge so cookie is cleared when browser closes; gate required on every new sign-in.
  });

  return NextResponse.json({ ok: true });
}
