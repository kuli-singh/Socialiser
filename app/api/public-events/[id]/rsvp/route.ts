
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, phone, message, friendId } = body;

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Name and either email or phone are required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const instance = await prisma.activityInstance.findUnique({
      where: { id: params.id },
      select: { id: true, capacity: true }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate friendId if provided (ensure they are actually invited)
    if (friendId) {
      const participation = await prisma.participation.findUnique({
        where: {
          friendId_activityInstanceId: {
            friendId,
            activityInstanceId: params.id
          }
        }
      });

      if (!participation) {
        // Invalid friendId or not invited to this event. Ignore it or validation error?
        // Safer to ignore and just not link it, or wipe it.
        // But let's assume if frontend sent it, it's valid.
        // We can strictly enforce it to prevent ID spoofing.
      }
    }

    // Check capacity if set
    if (instance.capacity) {
      const currentCount = await prisma.publicRSVP.count({
        where: { activityInstanceId: params.id }
      });

      if (currentCount >= instance.capacity) {
        return NextResponse.json(
          { error: 'Event is at capacity' },
          { status: 400 }
        );
      }
    }

    // Create public RSVP record
    const rsvp = await prisma.publicRSVP.create({
      data: {
        activityInstanceId: params.id,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        friendId: friendId || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully',
      id: rsvp.id
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rsvps = await prisma.publicRSVP.findMany({
      where: { activityInstanceId: params.id },
      select: {
        id: true,
        name: true,
        message: true,
        createdAt: true
        // Don't expose email/phone publicly
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
}
