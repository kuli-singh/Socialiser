
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { ActivityInstanceWithRelations, SerializedActivityInstanceWithRelations } from '@/lib/types';

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    const where: any = {
      userId: user.id
    };

    if (activityId) {
      // Verify that the activity belongs to the user
      const activity = await prisma.activity.findFirst({
        where: {
          id: activityId,
          userId: user.id
        }
      });

      if (!activity) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      }

      where.activityId = activityId;
    }

    const instances = await prisma.activityInstance.findMany({
      where,
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
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        publicRSVPs: true
      },
      orderBy: {
        datetime: 'asc'
      }
    });

    // Convert Date objects to ISO strings to prevent serialization issues
    const serializedInstances: SerializedActivityInstanceWithRelations[] = (instances as unknown as ActivityInstanceWithRelations[]).map((instance: ActivityInstanceWithRelations) => ({
      ...instance,
      datetime: instance.datetime?.toISOString() ?? null,
      endDate: instance.endDate?.toISOString() ?? null,
      createdAt: instance.createdAt?.toISOString() ?? null,
      updatedAt: instance.updatedAt?.toISOString() ?? null,
      activity: {
        ...instance.activity,
        createdAt: instance.activity?.createdAt?.toISOString() ?? null,
        updatedAt: instance.activity?.updatedAt?.toISOString() ?? null,
        values: instance.activity?.values?.map((v: ActivityInstanceWithRelations['activity']['values'][0]) => ({
          ...v,
          value: {
            ...v.value,
            createdAt: v.value?.createdAt?.toISOString() ?? null,
            updatedAt: v.value?.updatedAt?.toISOString() ?? null
          }
        })) ?? []
      },
      publicRSVPs: instance.publicRSVPs?.map(rsvp => ({
        ...rsvp,
        friendId: (rsvp as any).friendId ?? null,
        createdAt: rsvp.createdAt.toISOString()
      })) ?? []
    }));

    return NextResponse.json(serializedInstances);
  } catch (error) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      activityId,
      datetime,
      endDate,
      isAllDay,
      location,
      friendIds,
      customTitle,
      venue,
      address,
      city,
      state,
      zipCode,
      detailedDescription,
      requirements,
      contactInfo,
      venueType,
      priceInfo,
      capacity,
      locationId,
      eventUrl,
      allowExternalGuests,
      showGuestList
    } = body;

    if (!activityId || !datetime) {
      return NextResponse.json(
        { error: 'Activity ID and datetime are required' },
        { status: 400 }
      );
    }

    // Validate datetime
    const parsedDateTime = new Date(datetime);
    if (isNaN(parsedDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid datetime format' },
        { status: 400 }
      );
    }

    // Validate endDate if provided
    let parsedEndDate: Date | null = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }

      // Ensure end date is not before start date
      if (parsedEndDate < parsedDateTime) {
        return NextResponse.json(
          { error: 'End date cannot be before start date' },
          { status: 400 }
        );
      }
    }

    // Verify that the activity belongs to the user
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id
      }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Verify that all friendIds belong to the user
    if (friendIds && friendIds.length > 0) {
      const userFriends = await prisma.friend.findMany({
        where: {
          id: { in: friendIds },
          userId: user.id
        }
      });

      if (userFriends.length !== friendIds.length) {
        return NextResponse.json(
          { error: 'Some friends do not belong to the authenticated user' },
          { status: 403 }
        );
      }
    }

    const instance = await prisma.activityInstance.create({
      data: {
        activityId,
        datetime: parsedDateTime,
        endDate: parsedEndDate,
        isAllDay: isAllDay || false,
        location,
        locationId,
        userId: user.id,
        customTitle,
        venue,
        address,
        city,
        state,
        zipCode,
        detailedDescription,
        requirements,
        contactInfo,
        venueType,
        priceInfo,
        capacity,
        eventUrl,
        allowExternalGuests: allowExternalGuests ?? true,
        showGuestList: showGuestList ?? true,
        participations: friendIds ? {
          create: (friendIds as string[]).map((friendId: string) => ({
            friendId,
            userId: user.id
          }))
        } : undefined
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
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        publicRSVPs: true
      }
    });

    // Serialize the response to prevent Date object issues
    const serializedInstance: SerializedActivityInstanceWithRelations = {
      ...(instance as unknown as ActivityInstanceWithRelations),
      datetime: instance.datetime?.toISOString() ?? null,
      endDate: instance.endDate?.toISOString() ?? null,
      createdAt: instance.createdAt?.toISOString() ?? null,
      updatedAt: instance.updatedAt?.toISOString() ?? null,
      activity: {
        ...instance.activity,
        createdAt: instance.activity?.createdAt?.toISOString() ?? null,
        updatedAt: instance.activity?.updatedAt?.toISOString() ?? null,
        values: instance.activity?.values?.map((v: ActivityInstanceWithRelations['activity']['values'][0]) => ({
          ...v,
          value: {
            ...v.value,
            createdAt: v.value?.createdAt?.toISOString() ?? null,
            updatedAt: v.value?.updatedAt?.toISOString() ?? null
          }
        })) ?? []
      },
      publicRSVPs: instance.publicRSVPs?.map(rsvp => ({
        ...rsvp,
        friendId: (rsvp as any).friendId ?? null,
        createdAt: rsvp.createdAt.toISOString()
      })) ?? []
    };


    return NextResponse.json(serializedInstance, { status: 201 });
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}
