
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

    // Fetch all friends for the authenticated user
    const friends = await prisma.friend.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        name: true,
        email: true,
        group: true
      }
    });

    // Generate CSV content
    const csvHeader = 'name,email,group\n';
    const csvRows = friends.map(friend => {
      // Escape commas and quotes in CSV fields
      const escapeCsvField = (field: string | null) => {
        if (!field) return '';
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      return [
        escapeCsvField(friend.name),
        escapeCsvField(friend.email),
        escapeCsvField(friend.group)
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Return CSV with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="friends-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting friends:', error);
    return NextResponse.json(
      { error: 'Failed to export friends' },
      { status: 500 }
    );
  }
}
