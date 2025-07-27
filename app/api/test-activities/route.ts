
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log('Test activities API called');
    
    // Get activities without authentication for testing
    const activities = await prisma.activity.findMany({
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

    console.log(`Found ${activities.length} activities`);

    // Transform the data to match the expected format
    const serializedActivities = activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
      values: activity.values.map(av => ({
        value: {
          id: av.value.id,
          name: av.value.name
        }
      })),
      _count: {
        instances: activity._count.instances
      }
    }));

    return NextResponse.json(serializedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
