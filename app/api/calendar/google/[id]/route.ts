
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

function generateGoogleCalendarUrl(instance: any) {
  // Validate datetime before creating Date object
  if (!instance.datetime) {
    throw new Error('Invalid event datetime');
  }
  
  const startDate = new Date(instance.datetime);
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid event datetime format');
  }
  
  // Handle end date - use provided endDate or default to 2 hours later
  let endDate: Date;
  if (instance.endDate) {
    endDate = new Date(instance.endDate);
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid end date format');
    }
  } else {
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  }

  const isAllDay = instance.isAllDay || false;

  const formatGoogleDateTime = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().split('T')[0].replace(/[-]/g, '');
  };

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

  // Format dates based on event type
  let datesParam: string;
  if (isAllDay) {
    // For all-day events, use date format and end date should be the day after the last day
    const allDayEndDate = new Date(endDate);
    allDayEndDate.setDate(allDayEndDate.getDate() + 1);
    datesParam = `${formatGoogleDate(startDate)}/${formatGoogleDate(allDayEndDate)}`;
  } else {
    // For timed events, use datetime format
    datesParam = `${formatGoogleDateTime(startDate)}/${formatGoogleDateTime(endDate)}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: datesParam,
    details: eventDescription,
    location: eventLocation,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

    const googleCalendarUrl = generateGoogleCalendarUrl(instance);
    
    return NextResponse.json({ url: googleCalendarUrl });

  } catch (error) {
    console.error('Error generating Google Calendar URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Google Calendar URL' },
      { status: 500 }
    );
  }
}
