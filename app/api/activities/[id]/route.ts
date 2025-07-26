

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { ActivityInstanceWithRelations } from '@/lib/types';

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
        activity: {
          include: {
            values: {
              include: {
                value: true
              }
            }
          }
        },
        participations: {
          include: {
            friend: true
          }
        }
      }
    }) as ActivityInstanceWithRelations | null;

    if (!instance) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Format date for ICS
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/[-]/g, '');
    };

    // Validate and create start date
    if (!instance.datetime) {
      return NextResponse.json({ error: 'Invalid event datetime' }, { status: 400 });
    }
    
    const startDate = new Date(instance.datetime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid event datetime format' }, { status: 400 });
    }
    
    // Handle end date - use provided endDate or default to 2 hours later
    let endDate: Date;
    if (instance.endDate) {
      endDate = new Date(instance.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end date format' }, { status: 400 });
      }
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    }

    const isAllDay = instance.isAllDay || false;

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

    // Generate ICS content with proper formatting for all-day vs timed events
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Social Organizer//EN',
      'BEGIN:VEVENT',
      `UID:${instance.id}@socialorganizer.app`,
    ];

    // Add date/time fields based on event type
    if (isAllDay) {
      icsLines.push(`DTSTART;VALUE=DATE:${formatDate(startDate)}`);
      // For all-day events, end date should be the day after the last day
      const allDayEndDate = new Date(endDate);
      allDayEndDate.setDate(allDayEndDate.getDate() + 1);
      icsLines.push(`DTEND;VALUE=DATE:${formatDate(allDayEndDate)}`);
    } else {
      icsLines.push(`DTSTART:${formatDateTime(startDate)}`);
      icsLines.push(`DTEND:${formatDateTime(endDate)}`);
    }

    // Add remaining event fields
    icsLines.push(`SUMMARY:${eventTitle}`);
    if (eventLocation) icsLines.push(`LOCATION:${eventLocation}`);
    if (eventDescription) icsLines.push(`DESCRIPTION:${eventDescription}`);
    if (participants) icsLines.push(`ATTENDEE:${participants}`);
    icsLines.push(`CREATED:${formatDateTime(instance.createdAt)}`);
    icsLines.push(`LAST-MODIFIED:${formatDateTime(instance.updatedAt)}`);
    icsLines.push('END:VEVENT');
    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

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

