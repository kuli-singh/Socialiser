
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

    const url = new URL(request.url);
    const activityId = url.searchParams.get('activityId');

    const whereClause: any = {
      activity: {
        userId: user.id
      }
    };

    if (activityId) {
      whereClause.activityId = activityId;
    }

    const instances = await prisma.activityInstance.findMany({
      where: whereClause,
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
      endDate,
      location, 
      notes, 
      invitedFriends,
      isAllDay 
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
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      );
    }

    // Create the instance
    const instance = await prisma.activityInstance.create({
      data: {
        activityId,
        datetime: parsedDateTime,
        endDate: parsedEndDate,
        location: location || null,
        notes: notes || null,
        isAllDay: isAllDay || false
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

    // Create participations for invited friends
    if (invitedFriends && invitedFriends.length > 0) {
      await prisma.participation.createMany({
        data: invitedFriends.map((friendId: string) => ({
          instanceId: instance.id,
          friendId: friendId,
          status: 'INVITED'
        }))
      });

      // Fetch the instance again with participations
      const instanceWithParticipations = await prisma.activityInstance.findUnique({
        where: { id: instance.id },
        include: {
          activity: true,
          participations: {
            include: {
              friend: true
            }
          }
        }
      });

      return NextResponse.json(instanceWithParticipations);
    }

    return NextResponse.json(instance);
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}

