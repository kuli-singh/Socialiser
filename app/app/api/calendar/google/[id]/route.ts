
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
  const startDate = new Date(instance.datetime);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
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

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
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
    
    return NextResponse.redirect(googleCalendarUrl);

  } catch (error) {
    console.error('Error generating Google Calendar URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Google Calendar URL' },
      { status: 500 }
    );
  }
}
