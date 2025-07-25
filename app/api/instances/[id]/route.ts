
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
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Serialize the response to prevent Date object issues
    const serializedInstance = {
      ...instance,
      datetime: instance.datetime?.toISOString() ?? null,
      createdAt: instance.createdAt?.toISOString() ?? null,
      updatedAt: instance.updatedAt?.toISOString() ?? null,
      activity: {
        ...instance.activity,
        createdAt: instance.activity?.createdAt?.toISOString() ?? null,
        updatedAt: instance.activity?.updatedAt?.toISOString() ?? null
      }
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
      capacity
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

    // Delete existing participations and create new ones
    await prisma.participation.deleteMany({
      where: { 
        activityInstanceId: params.id,
        userId: user.id
      }
    });

    const instance = await prisma.activityInstance.update({
      where: { id: params.id },
      data: {
        datetime: parsedDateTime,
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
        participations: friendIds ? {
          create: friendIds.map((friendId: string) => ({
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
        }
      }
    });

    // Serialize the response to prevent Date object issues
    const serializedInstance = {
      ...instance,
      datetime: instance.datetime?.toISOString() ?? null,
      createdAt: instance.createdAt?.toISOString() ?? null,
      updatedAt: instance.updatedAt?.toISOString() ?? null,
      activity: {
        ...instance.activity,
        createdAt: instance.activity?.createdAt?.toISOString() ?? null,
        updatedAt: instance.activity?.updatedAt?.toISOString() ?? null
      }
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
