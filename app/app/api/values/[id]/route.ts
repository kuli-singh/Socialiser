
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

async function verifyValueOwnership(valueId: string, userId: string) {
  const value = await prisma.coreValue.findFirst({
    where: {
      id: valueId,
      userId: userId
    }
  });
  return !!value;
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

    const value = await prisma.coreValue.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!value) {
      return NextResponse.json(
        { error: 'Value not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(value);
  } catch (error) {
    console.error('Error fetching value:', error);
    return NextResponse.json(
      { error: 'Failed to fetch value' },
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

    const hasAccess = await verifyValueOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Check if another value with the same name exists for this user
    const existingValue = await prisma.coreValue.findFirst({
      where: {
        name,
        userId: user.id,
        id: { not: params.id }
      }
    });

    if (existingValue) {
      return NextResponse.json(
        { error: 'A value with this name already exists' },
        { status: 400 }
      );
    }

    const value = await prisma.coreValue.update({
      where: { id: params.id },
      data: {
        name,
        description
      }
    });

    return NextResponse.json(value);
  } catch (error) {
    console.error('Error updating value:', error);
    return NextResponse.json(
      { error: 'Failed to update value' },
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

    const hasAccess = await verifyValueOwnership(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.coreValue.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Value deleted successfully' });
  } catch (error) {
    console.error('Error deleting value:', error);
    return NextResponse.json(
      { error: 'Failed to delete value' },
      { status: 500 }
    );
  }
}
