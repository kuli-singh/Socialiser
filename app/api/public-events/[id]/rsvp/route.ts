
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
      select: { id: true, capacity: true, allowExternalGuests: true, showGuestList: true, hostAttending: true }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate friendId if provided (ensure they are actually invited)
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
        // If invalid friend ID provided, treat as external guest?
        // Or reject? Let's treat as just invalid linking, but if external guests NOT allowed, this is a blocker.
        if (!instance.allowExternalGuests) {
          return NextResponse.json(
            { error: 'This invitation is strictly for invited guests. Please select your name from the list.' },
            { status: 403 }
          );
        }
      }
    } else {
      // No friendId provided (External Guest)
      if (!instance.allowExternalGuests) {
        return NextResponse.json(
          { error: 'This invite does not allow external guests. Please select your name from the list.' },
          { status: 403 }
        );
      }
    }

    // Check capacity if set
    if (instance.capacity) {
      const currentCount = await prisma.publicRSVP.count({
        where: { activityInstanceId: params.id }
      });

      const hostCount = instance.hostAttending ? 1 : 0;

      if (currentCount + hostCount >= instance.capacity) {
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
        friendId: true,
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
