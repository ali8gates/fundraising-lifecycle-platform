import { prisma } from '@chti/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { companyId: string; startsAt: string; endsAt: string; title?: string; location?: string } | null;
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  const company = await prisma.company.findUnique({ where: { id: body.companyId } });
  if (!company) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const title = body.title ?? `${company.name} x AHA Innovators Network`;
  const ics = buildICS({ title, startsAt, endsAt, description: `Meeting with ${company.name}`, location: body.location ?? '' });

  const inviteLink = googleCalendarLink({ title, startsAt, endsAt, details: `Meeting with ${company.name}`, location: body.location ?? '' });
  const meeting = await prisma.meeting.create({ data: { companyId: company.id, startsAt, endsAt, location: body.location, inviteLink } });

  return NextResponse.json({ meeting, ics, links: { google: inviteLink, outlook: outlookCalendarLink({ title, startsAt, endsAt, details: `Meeting with ${company.name}`, location: body.location ?? '' }) } });
}

function pad(n: number): string { return String(n).padStart(2, '0'); }
function toICSDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS({ title, startsAt, endsAt, description, location }: { title: string; startsAt: Date; endsAt: Date; description: string; location: string; }): string {
  const uid = `${Date.now()}@chti.local`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CHTI//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startsAt)}`,
    `DTEND:${toICSDate(endsAt)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function escapeICS(s: string): string { return s.replace(/[\\;,\n]/g, (m) => ({ '\\': '\\\\', ';': '\\;', ',': '\\,', '\n': '\\n' } as any)[m]); }

function googleCalendarLink({ title, startsAt, endsAt, details, location }: { title: string; startsAt: Date; endsAt: Date; details: string; location: string; }) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title,
    dates: `${toICSDate(startsAt)}/${toICSDate(endsAt)}`,
    details,
    location,
  });
  return `${base}&${params.toString()}`;
}

function outlookCalendarLink({ title, startsAt, endsAt, details, location }: { title: string; startsAt: Date; endsAt: Date; details: string; location: string; }) {
  const base = 'https://outlook.live.com/owa/?rru=addevent';
  const params = new URLSearchParams({
    subject: title,
    body: details,
    startdt: startsAt.toISOString(),
    enddt: endsAt.toISOString(),
    location,
  });
  return `${base}&${params.toString()}`;
}

