
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instance = await prisma.activityInstance.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        activity: true,
        participations: {
          include: {
            friend: true
          }
        }
      }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Format date for ICS
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = new Date(instance.datetime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    const eventTitle = instance.customTitle || instance.activity.name;
    const eventLocation = instance.venue ? 
      `${instance.venue}${instance.address ? `, ${instance.address}` : ''}${instance.city ? `, ${instance.city}` : ''}${instance.state ? `, ${instance.state}` : ''}${instance.zipCode ? ` ${instance.zipCode}` : ''}` :
      instance.location || '';

    const eventDescription = [
      instance.detailedDescription || instance.activity.description || '',
      instance.requirements ? `\n\nWhat to bring: ${instance.requirements}` : '',
      instance.contactInfo ? `\n\nContact: ${instance.contactInfo}` : '',
      instance.priceInfo ? `\n\nPrice: ${instance.priceInfo}` : '',
      instance.capacity ? `\n\nCapacity: ${instance.capacity} people` : '',
    ].filter(Boolean).join('');

    const participants = instance.participations?.map(p => p.friend.name).join(', ') || '';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Social Organizer//EN',
      'BEGIN:VEVENT',
      `UID:${instance.id}@socialorganizer.app`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${eventTitle}`,
      eventLocation ? `LOCATION:${eventLocation}` : '',
      eventDescription ? `DESCRIPTION:${eventDescription}` : '',
      participants ? `ATTENDEE:${participants}` : '',
      `CREATED:${formatDate(instance.createdAt)}`,
      `LAST-MODIFIED:${formatDate(instance.updatedAt)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`
      }
    });

  } catch (error) {
    console.error('Error generating calendar file:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
