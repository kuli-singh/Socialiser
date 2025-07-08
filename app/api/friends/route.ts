
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

    const friends = await prisma.friend.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
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
    const { name, group } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const friend = await prisma.friend.create({
      data: {
        name,
        phone: "000", // Always set dummy phone value
        group,
        userId: user.id
      }
    });

    return NextResponse.json(friend, { status: 201 });
  } catch (error) {
    console.error('Error creating friend:', error);
    return NextResponse.json(
      { error: 'Failed to create friend' },
      { status: 500 }
    );
  }
}
