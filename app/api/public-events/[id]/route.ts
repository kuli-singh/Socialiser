
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
                // Don't expose phone/email in public view
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
      participantCount: instance.participations?.length ?? 0,
      participantNames: instance.participations?.map(p => p?.friend?.name).filter(Boolean) ?? []
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
