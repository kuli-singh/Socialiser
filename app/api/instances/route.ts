
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
        activity: true,
        participations: {
          include: {
            friend: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });

    return NextResponse.json(instances);
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

    if (!activityId || !datetime) {
      return NextResponse.json(
        { error: 'Activity ID and datetime are required' },
        { status: 400 }
      );
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
        datetime: new Date(datetime),
        location,
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
        participations: friendIds ? {
          create: friendIds.map((friendId: string) => ({
            friendId,
            userId: user.id
          }))
        } : undefined
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

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}
