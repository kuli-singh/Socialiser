
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instance = await prisma.activityInstance.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { name: true }
        },
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
            friend: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            }
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

    // Determine participants
    const participants = instance.participations?.map(p => ({
      name: p?.friend?.name,
      id: p?.friend?.id
    })).filter(p => !!p.name) ?? [];

    if (instance.hostAttending && instance.user?.name) {
      participants.unshift({
        name: `${instance.user.name} (Host)`,
        id: 'host'
      });
    }

    // Sanitize data for public consumption
    const publicInstance = {
      id: instance.id,
      datetime: instance.datetime?.toISOString() ?? null,
      location: instance.location,
      customTitle: instance.customTitle,
      venue: instance.venue,
      address: instance.address,
      city: instance.city,
      state: instance.state,
      zipCode: instance.zipCode,
      detailedDescription: instance.detailedDescription,
      requirements: instance.requirements,
      contactInfo: instance.contactInfo,
      venueType: instance.venueType,
      priceInfo: instance.priceInfo,
      capacity: instance.capacity,
      eventUrl: instance.eventUrl,
      hostAttending: instance.hostAttending,
      allowExternalGuests: instance.allowExternalGuests,
      activity: {
        id: instance.activity.id,
        name: instance.activity.name,
        description: instance.activity.description,
        values: instance.activity.values?.map(av => ({
          value: {
            id: av?.value?.id,
            name: av?.value?.name
          }
        })) ?? []
      },
      participantCount: participants.length,
      participantNames: participants.map(p => p.name),
      invitedFriends: instance.participations?.map(p => ({
        id: p.friendId,
        name: p.friend.name,
        email: p.friend.email,
        phoneNumber: p.friend.phoneNumber
      })) ?? [] // For Smart Matching
    };

    return NextResponse.json(publicInstance);
  } catch (error) {
    console.error('Error fetching public event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
