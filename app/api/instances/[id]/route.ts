
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

async function verifyInstanceOwnership(instanceId: string, userId: string) {
  const instance = await prisma.activityInstance.findFirst({
    where: {
      id: instanceId,
      userId: userId
    }
  });
  return !!instance;
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
        user: {
          select: {
            name: true,
            email: true
          }
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
            friend: true
          }
        },
        publicRSVPs: true
      }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

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

    return NextResponse.json(serializedInstance);
  } catch (error) {
    console.error('Error fetching instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await verifyInstanceOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      datetime,
      endDate,
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
      eventUrl,
      allowExternalGuests
    } = body;

    // Validate datetime if provided
    let parsedDateTime: Date | undefined;
    if (datetime) {
      parsedDateTime = new Date(datetime);
      if (isNaN(parsedDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid datetime format' },
          { status: 400 }
        );
      }
    }

    // Validate endDate if provided
    let parsedEndDate: Date | null | undefined;
    if (endDate !== undefined) {
      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid end date format' },
            { status: 400 }
          );
        }

        // Ensure end date is not before start date (if start date is also being updated or exists)
        const effectiveStart = parsedDateTime || (await prisma.activityInstance.findUnique({ where: { id: params.id }, select: { datetime: true } }))?.datetime;

        if (effectiveStart && parsedEndDate < effectiveStart) {
          return NextResponse.json(
            { error: 'End date cannot be before start date' },
            { status: 400 }
          );
        }
      } else {
        parsedEndDate = null;
      }
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

    // Manage participations: Upsert logic to preserve invite tokens
    if (friendIds) {
      const existingParticipations = await prisma.participation.findMany({
        where: { activityInstanceId: params.id },
        select: { friendId: true }
      });

      const existingFriendIds = existingParticipations.map(p => p.friendId);

      // 1. Identify friends to remove (in existing but not in new list)
      const friendsToRemove = existingFriendIds.filter(id => !friendIds.includes(id));

      // 2. Identify friends to add (in new list but not in existing)
      const friendsToAdd = friendIds.filter((id: string) => !existingFriendIds.includes(id));

      if (friendsToRemove.length > 0) {
        await prisma.participation.deleteMany({
          where: {
            activityInstanceId: params.id,
            friendId: { in: friendsToRemove }
          }
        });
      }

      if (friendsToAdd.length > 0) {
        await prisma.participation.createMany({
          data: friendsToAdd.map((friendId: string) => ({
            activityInstanceId: params.id,
            userId: user.id,
            friendId: friendId
          }))
        });
      }
    }

    const instance = await prisma.activityInstance.update({
      where: { id: params.id },
      data: {
        datetime: parsedDateTime,
        endDate: parsedEndDate,
        location,
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
        allowExternalGuests,
        showGuestList: body.showGuestList !== undefined ? body.showGuestList : undefined,
        // participations handled separately above
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
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
            friend: true
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

    return NextResponse.json(serializedInstance);
  } catch (error) {
    console.error('Error updating instance:', error);
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await verifyInstanceOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.activityInstance.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
}
