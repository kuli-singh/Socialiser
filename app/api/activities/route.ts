
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id
      },
      include: {
        values: {
          include: {
            value: true
          }
        },
        _count: {
          select: {
            instances: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, valueIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      );
    }

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

    const activity = await prisma.activity.create({
      data: {
        name,
        description,
        userId: user.id,
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

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
