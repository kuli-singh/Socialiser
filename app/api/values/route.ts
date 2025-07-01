
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

    const values = await prisma.coreValue.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(values);
  } catch (error) {
    console.error('Error fetching values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch values' },
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Value name is required' },
        { status: 400 }
      );
    }

    // Check if value already exists for this user
    const existingValue = await prisma.coreValue.findFirst({
      where: {
        name,
        userId: user.id
      }
    });

    if (existingValue) {
      return NextResponse.json(
        { error: 'A value with this name already exists' },
        { status: 400 }
      );
    }

    const value = await prisma.coreValue.create({
      data: {
        name,
        description,
        userId: user.id
      }
    });

    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    console.error('Error creating value:', error);
    return NextResponse.json(
      { error: 'Failed to create value' },
      { status: 500 }
    );
  }
}
