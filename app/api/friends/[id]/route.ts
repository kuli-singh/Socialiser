
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

async function verifyFriendOwnership(friendId: string, userId: string) {
  const friend = await prisma.friend.findFirst({
    where: {
      id: friendId,
      userId: userId
    }
  });
  return !!friend;
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

    const friend = await prisma.friend.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(friend);
  } catch (error) {
    console.error('Error fetching friend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend' },
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

    const hasAccess = await verifyFriendOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, group } = body;

    const friend = await prisma.friend.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null, // Optional email field
        phone: "000", // Always maintain dummy phone value
        group
      }
    });

    return NextResponse.json(friend);
  } catch (error) {
    console.error('Error updating friend:', error);
    return NextResponse.json(
      { error: 'Failed to update friend' },
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

    const hasAccess = await verifyFriendOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.friend.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Friend deleted successfully' });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return NextResponse.json(
      { error: 'Failed to delete friend' },
      { status: 500 }
    );
  }
}
