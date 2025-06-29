
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

async function verifyActivityOwnership(activityId: string, userId: string) {
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      userId: userId
    }
  });
  return !!activity;
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

    const activity = await prisma.activity.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        values: {
          include: {
            value: true
          }
        },
        instances: {
          include: {
            participations: {
              include: {
                friend: true
              }
            }
          },
          orderBy: {
            datetime: 'asc'
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
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

    const hasAccess = await verifyActivityOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, valueIds } = body;

    // Verify that all valueIds belong to the authenticated user
    if (valueIds && valueIds.length > 0) {
      const userValues = await prisma.coreValue.findMany({
        where: {
          id: { in: valueIds },
          userId: user.id
        }
      });

      if (userValues.length !== valueIds.length) {
        return NextResponse.json(
          { error: 'Some values do not belong to the authenticated user' },
          { status: 403 }
        );
      }
    }

    // Delete existing value relationships
    await prisma.activityValue.deleteMany({
      where: { activityId: params.id }
    });

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        name,
        description,
        values: valueIds ? {
          create: valueIds.map((valueId: string) => ({
            valueId
          }))
        } : undefined
      },
      include: {
        values: {
          include: {
            value: true
          }
        }
      }
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
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

    const hasAccess = await verifyActivityOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.activity.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
